import os
import json
import logging
from typing import Dict, Any
from datetime import datetime
from decimal import Decimal, InvalidOperation

import gspread
from google.oauth2.service_account import Credentials

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuración
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
CREDENTIALS_FILE = 'credentials.json'
SHEET_ID = os.environ["SHEET_ID"]
WORKSHEET_NAME = os.environ["WORKSHEET_NAME"]

VALID_CATEGORIES = [
    "Criptomonedas",
    "Fintual",
    "Agua",
    "Arriendo",
    "Gasto Común",
    "Internet",
    "Luz",
    "Almuerzo",
    "Comision BC",
    "Familia",
    "Farmacia",
    "Metro",
    "Otros",
    "Recreacional",
    "Regalos",
    "Ropa",
    "Supermercado",
    "Transporte",
    "Vacaciones",
    "Apps",
    "Eventos",
    "Electronica",
    "Hogar",
    "Limpieza",
    "Ingreso",
]


class ExpenseError(Exception):
    """Excepción base para errores de gastos."""
    pass


def validate_date(date_str: str) -> str:
    """Valida formato DD-MM-YYYY."""
    try:
        datetime.strptime(date_str, "%d-%m-%Y")
        return date_str
    except ValueError:
        raise ExpenseError(f"Fecha inválida: {date_str}. Use formato DD-MM-YYYY")


def validate_amount(amount: str) -> str:
    """Valida que el monto sea positivo."""
    try:
        decimal_amount = Decimal(str(amount).replace(',', '.'))
        if decimal_amount <= 0:
            raise ExpenseError("El monto debe ser mayor a cero")
        return f"{decimal_amount:.2f}"
    except (InvalidOperation, ValueError):
        raise ExpenseError(f"Monto inválido: {amount}")


def validate_category(category: str) -> str:
    """Valida que la categoría exista."""
    if category not in VALID_CATEGORIES:
        raise ExpenseError(
            f"Categoría inválida. Opciones: {', '.join(VALID_CATEGORIES)}"
        )
    return category


def validate_field(value: Any, field_name: str) -> str:
    """Valida que un campo no esté vacío."""
    if not value or not str(value).strip():
        raise ExpenseError(f"El campo '{field_name}' es requerido")
    return str(value).strip()


def parse_payload(event: Dict[str, Any]) -> Dict[str, str]:
    """Extrae y valida datos del evento Lambda."""
    try:
        body = json.loads(event['body']) if isinstance(event.get('body'), str) else event.get('body', event)
        
        return {
            'date': validate_date(validate_field(body.get('date'), 'date')),
            'description': validate_field(body.get('description'), 'description'),
            'category': validate_category(validate_field(body.get('category'), 'category')),
            'amount': validate_amount(validate_field(body.get('amount'), 'amount')),
            'account': validate_field(body.get('account'), 'account')
        }
    except (json.JSONDecodeError, KeyError) as e:
        raise ExpenseError(f"Payload inválido: {str(e)}")


def append_to_sheet(expense: Dict[str, str]) -> str:
    """Inserta el gasto en Google Sheets usando gspread."""
    try:
        # Autenticar con gspread
        creds = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=SCOPES)
        client = gspread.authorize(creds)
        
        # Abrir la hoja
        sheet = client.open_by_key(SHEET_ID).worksheet(WORKSHEET_NAME)
        
        # Obtener la siguiente fila vacía
        next_row = len(sheet.get_all_values()) + 1
        
        # Mapeo de columnas: solo insertar en columnas específicas
        # A=1: Fecha, C=3: Descripción, D=4: Categoría, G=7: Monto, H=8: Cuenta
        column_mapping = {
            'A': expense['date'],        # Columna 1
            'C': expense['description'], # Columna 3
            'D': expense['category'],    # Columna 4
            'G': float(expense['amount']),      # Columna 7
            'H': expense['account']      # Columna 8
        }
        
        # Insertar valores solo en las columnas necesarias
        for col, value in column_mapping.items():
            cell = f"{col}{next_row}"
            sheet.update(cell, [[value]], value_input_option='USER_ENTERED')
        
        range_updated = f"{WORKSHEET_NAME}!A{next_row}:H{next_row}"
        logger.info(f"Gasto registrado en: {range_updated}")
        return range_updated
        
    except gspread.exceptions.APIError as e:
        logger.error(f"Error de API de Google Sheets: {str(e)}")
        raise ExpenseError(f"Error al conectar con Google Sheets: {str(e)}")
    except Exception as e:
        logger.error(f"Error inesperado: {str(e)}")
        raise ExpenseError(f"Error al insertar datos: {str(e)}")


def create_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """Crea respuesta HTTP formateada."""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(body, ensure_ascii=False)
    }


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handler principal de Lambda para registrar gastos en Google Sheets.
    
    Payload esperado:
    {
        "body": {
            "date": "24-10-2025",
            "description": "Descripción del gasto",
            "category": "Recreacional",
            "amount": "100.00",
            "account": "Banco de Chile"
        }
    }
    """
    logger.info(f"Evento recibido: {json.dumps(event)}")
    
    try:
        # Validar payload
        expense = parse_payload(event)
        logger.info(f"Gasto validado: {expense}")
        
        # Insertar en Google Sheets
        updated_range = append_to_sheet(expense)
        
        # Respuesta exitosa
        message = (
            f"✅ Registro agregado exitosamente:\n"
            f"📂 Categoría: {expense['category']}\n"
            f"📅 Fecha: {expense['date']}\n"
            f"📝 Descripción: {expense['description']}\n"
            f"💰 Monto: ${expense['amount']}\n"
            f"🏦 Cuenta: {expense['account']}\n"
            f"📊 Celda: {updated_range}"
        )
        
        return create_response(200, {
            'message': message,
            'data': {'expense': expense, 'updated_range': updated_range}
        })
        
    except ExpenseError as e:
        logger.warning(f"Error de validación/operación: {str(e)}")
        return create_response(400, {'error': str(e)})
        
    except Exception as e:
        logger.exception(f"Error inesperado: {str(e)}")
        return create_response(500, {'error': 'Error interno del servidor'})