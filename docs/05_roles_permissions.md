# Permisos de Roles (Matriz RBAC)

| Módulo / Funcionalidad | Gerente | Responsable Almacén | Cocinero | Cliente | Trabajador (Comensal) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Proveedores (CRUD)** | ✔️ | ❌ | ❌ | ❌ | ❌ |
| **Compras** | ✔️ | ✔️ (Ingresar) | ❌ | ❌ | ❌ |
| **Inventario (Ver)** | ✔️ | ✔️ | ✔️ | ❌ | ❌ |
| **Inventario (Mermas / Ajustes)**| ✔️ | ✔️ | ❌ | ❌ | ❌ |
| **Alertas (Venc/Stock)** | ✔️ | ✔️ | ✔️ (Solo Stock) | ❌ | ❌ |
| **Menú Semanal (Crear/Editar)**| ✔️ | ❌ | ❌ | ❌ | ❌ |
| **Menú Diario (Consultar)** | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |
| **Cocina (Retirar/Reportar)** | ✔️ | ❌ | ✔️ | ❌ | ❌ |
| **Consumo (Marcar / Autorizar base)**| ❌ | ❌ | ❌ | ❌ | ✔️ (por QR) |
| **Consumo (Doble Ración)** | ✔️ | ❌ | ❌ | ❌ | ❌ |
| **Reportes y Dashboard** | ✔️ | ❌ | ❌ | ✔️ (Ver Consumos) | ❌ |
| **Facturación** | ✔️ | ❌ | ❌ | ❌ | ❌ |
| **Validar Reporte / Aprobación**| ❌ | ❌ | ❌ | ✔️ | ❌ |
| **Asistencia Staff (Marcar)** | ✔️ | ✔️ | ✔️ | ❌ | ❌ |
| **Asistencia Staff (Ver Historico)**| ✔️ | ❌ | ❌ | ❌ | ❌ |
| **Usuarios y Roles** | ✔️ | ❌ | ❌ | ❌ | ❌ |
