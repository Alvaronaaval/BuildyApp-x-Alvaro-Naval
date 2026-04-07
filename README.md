BildyApp API - Gestion de Usuarios
Backend para la aplicacion BildyApp. API REST para la gestion de usuarios, autenticacion, onboarding de empresas y administracion de cuentas.

Tecnologias Utilizadas
Node.js v22 con ESM

Express 5

MongoDB Atlas y Mongoose 8

Zod para validacion de datos

JWT y bcryptjs para autenticacion y cifrado

Helmet y Express Rate Limit para seguridad

Multer para subida de archivos

Instalacion y Ejecucion
Clonar el repositorio.

Ejecutar npm install para descargar las dependencias.

Copiar el archivo .env.example a .env y asignar los valores reales a las variables.

Ejecutar npm run dev para levantar el servidor en modo desarrollo.

Funcionalidades
Registro, login, cierre de sesion y rotacion de refresh tokens.

Validacion de cuenta de usuario mediante codigo numerico.

Onboarding dinamico para asignacion de compañias o creacion de perfiles freelance.

Control de acceso basado en roles.

Borrado logico de registros en base de datos.

Middleware centralizado para captura y formateo de errores.

Pruebas de la API
Se incluye un archivo bildyapp.http en la raiz del proyecto para ejecutar pruebas con la extension REST Client. Este archivo utiliza variables globales para evitar la repeticion manual de los tokens de autenticacion en cada peticion.

Para probar la subida del logo de la compañia, el archivo HTTP utiliza el formato multipart/form-data. Esto permite enviar archivos binarios dividiendo el cuerpo de la peticion en compartimentos separados por un limite textual. Para que la prueba funcione localmente, es necesario colocar una imagen en el mismo directorio que el archivo HTTP y referenciarla en la peticion.

Detalles de Implementacion Interna de funciones extra
El (express-mongo-sanitize) que me pedias en el README de la practica no es compatible con Express 5, hubiese molado un aviso. Hice un archivo .js sencillo de sanitizacion manual basica.

sanitize.js
Es un middleware de seguridad cuyo proposito es evitar ataques de inyeccion NoSQL. Los operadores de consulta en MongoDB comienzan con el signo de dolar. Si se permite que estos caracteres lleguen a la base de datos desde el cuerpo de una peticion, un atacante podria alterar la logica de las consultas.

Funcionamiento:
El script revisa el objeto req.body antes de que llegue a los controladores. Aplica una funcion recursiva que recorre cada propiedad del JSON. Si encuentra una clave que inicia con el signo de dolar, la elimina del objeto. Si el valor analizado es un objeto anidado, la funcion se llama a si misma para procesar ese subnivel. Una vez completado el proceso de limpieza, llama a next() para continuar con el flujo de la aplicacion. Se implementa de forma manual para evitar conflictos de sobrescritura de propiedades que ocurren al usar paquetes de terceros en la version 5 de Express.
