# AWS Lambda Google Sheets Expense Tracker

Este proyecto implementa una función AWS Lambda que permite registrar gastos en una hoja de Google Sheets. La función está diseñada para recibir datos de gastos a través de una API y automáticamente los registra en una hoja de cálculo especificada.

## Características

- ✅ Registro automático de gastos en Google Sheets
- 🔒 Autenticación segura con Google Sheets API
- ✅ Validación de datos de entrada
- 📊 Soporte para múltiples categorías de gastos
- 🌐 API REST con soporte CORS
- 🚀 Fácil despliegue usando AWS SAM

## Requisitos Previos

- Python 3.x
- AWS CLI configurado
- AWS SAM CLI instalado
- Cuenta de Google Cloud Platform con Google Sheets API habilitada
- Credenciales de servicio de Google Cloud (`credentials.json`)

## Configuración

### 1. Variables de Entorno

La función requiere las siguientes variables de entorno:

- `SHEET_ID`: ID de la hoja de Google Sheets
- `WORKSHEET_NAME`: Nombre de la hoja de trabajo específica

### 2. Credenciales de Google

1. Crear un proyecto en Google Cloud Console
2. Habilitar Google Sheets API
3. Crear credenciales de cuenta de servicio
4. Descargar el archivo `credentials.json`
5. Compartir la hoja de Google Sheets con el email de la cuenta de servicio

## Estructura del Proyecto

```
.
├── credentials.json
├── lambda_function.py
├── pyproject.toml
├── README.md
├── requirements.txt
├── samconfig.toml
└── template.yaml
```

## Categorías de Gastos Soportadas (Pueden modificarse)

- Criptomonedas
- Fintual
- Agua
- Arriendo
- Gasto Común
- Internet
- Luz
- Almuerzo
- Comision BC
- Familia
- Farmacia
- Metro
- Otros
- Recreacional
- Regalos
- Ropa
- Supermercado
- Transporte
- Vacaciones
- Apps
- Eventos
- Electronica
- Hogar
- Limpieza
- Ingreso

## Uso de la API

### Endpoint

POST a tu API Gateway endpoint

### Payload

```json
{
    "date": "24-10-2025",
    "description": "Descripción del gasto",
    "category": "Recreacional",
    "amount": "100.00",
    "account": "Banco de Chile"
}
```

### Respuesta Exitosa

```json
{
    "message": "✅ Registro agregado exitosamente...",
    "data": {
        "expense": {
            "date": "24-10-2025",
            "description": "Descripción del gasto",
            "category": "Recreacional",
            "amount": "100.00",
            "account": "Banco de Chile"
        },
        "updated_range": "Hoja1!A1:H1"
    }
}
```

## Despliegue

1. Construir la aplicación:
```bash
sam build
```

2. Desplegar la aplicación:
```bash
sam deploy --guided --profile <profile-name>
```

## Estructura de la Hoja de Cálculo

La función espera una hoja de cálculo con las siguientes columnas:

- A: Fecha (DD-MM-YYYY)
- C: Descripción
- D: Categoría
- G: Monto
- H: Cuenta

## Manejo de Errores

La función incluye validación completa de datos y manejo de errores para:
- Formato de fecha inválido
- Montos negativos o inválidos
- Categorías no reconocidas
- Campos faltantes o vacíos
- Errores de conexión con Google Sheets

## Desarrollo Local

Para probar la función localmente:

```bash
sam local invoke -e event.json
```

Donde `event.json` contiene el payload de prueba.
