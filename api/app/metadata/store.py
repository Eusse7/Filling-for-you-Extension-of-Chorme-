class StoreMetadata:
    """Constantes de almacenamiento usadas por los repositorios."""

    upsert_kv_sql = 'INSERT OR REPLACE INTO kv_store(key, value) VALUES(?, ?)'
    """SQL para insertar o actualizar un valor JSON por clave."""

    default_logs_max_items = 500
    """Cantidad máxima de eventos persistidos por backend de logs."""