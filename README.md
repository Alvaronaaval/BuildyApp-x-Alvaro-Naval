BildyApp API
Backend completo para la aplicacion BildyApp. API REST para la gestion de usuarios, autenticacion, clientes, proyectos y albaranes.

Tecnologias Utilizadas
Node.js v22 con ESM

Express 5

MongoDB Atlas y Mongoose 8

Zod para validacion de datos

JWT y bcryptjs para autenticacion y cifrado

Helmet y Express Rate Limit para seguridad

Multer y Sharp para optimizacion y subida de archivos

Swagger (OpenAPI 3.0) para documentacion interactiva

Socket.IO para webSockets y notificaciones en tiempo real

Nodemailer para envio de emails

Slack Webhooks para monitorizacion de errores 5XX

Docker y GitHub Actions para containerizacion y CI

Instalacion y Ejecucion (Local)
Clonar el repositorio.

Ejecutar npm install para descargar las dependencias.

Copiar el archivo .env.example a .env y asignar los valores reales a las variables.

Ejecutar npm run dev para levantar el servidor en modo desarrollo.

Instalacion y Ejecucion (Docker)
Asegurate de tener Docker abierto en tu equipo.

Ejecutar el comando: docker-compose up --build

Esto descargara la imagen de MongoDB, creara un contenedor local para la base de datos y levantara la API automaticamente de forma vinculada.

Documentacion de la API (Swagger)
Una vez que el servidor este funcionando (local o Docker), puedes acceder a la interfaz grafica de Swagger para visualizar y probar todos los endpoints visitando:

http://localhost:3000/api-docs

Funcionalidades
Registro, login, rotacion de refresh tokens y validacion de cuenta con codigo numerico.

Onboarding dinamico para asignacion de compañias o creacion de perfiles freelance.

Gestion completa de Clientes, Proyectos y Albaranes (CRUD, paginacion y borrado logico).

Generacion automatizada de documentos PDF descargables para los albaranes.

Sistema de firma de albaranes con procesamiento de imagen (Sharp) y subida a la nube (Cloudinary).

Notificaciones push en tiempo real para eventos dentro de cada compañia (Socket.IO).

Control de acceso basado en roles y middleware centralizado de errores.

Pruebas de la API
Se incluye un archivo bildyapp.http en la raiz del proyecto para ejecutar pruebas con la extension REST Client. Este archivo utiliza variables globales para evitar la repeticion manual de los tokens de autenticacion en cada peticion.

Para probar la subida del logo de la compañia o la firma de albaranes, el archivo HTTP utiliza el formato multipart/form-data. Esto permite enviar archivos binarios dividiendo el cuerpo de la peticion en compartimentos separados por un limite textual. Para que la prueba funcione localmente, es necesario colocar una imagen en el mismo directorio que el archivo HTTP y referenciarla en la peticion.

Detalles de Implementacion Interna de funciones extra
El (express-mongo-sanitize) que me pedias en el README de la practica no es compatible con Express 5, hubiese molado un aviso. Hice un archivo .js sencillo de sanitizacion manual basica.

sanitize.js
Es un middleware de seguridad cuyo proposito es evitar ataques de inyeccion NoSQL. Los operadores de consulta en MongoDB comienzan con el signo de dolar. Si se permite que estos caracteres lleguen a la base de datos desde el cuerpo de una peticion, un atacante podria alterar la logica de las consultas.

Funcionamiento:
El script revisa el objeto req.body antes de que llegue a los controladores. Aplica una funcion recursiva que recorre cada propiedad del JSON. Si encuentra una clave que inicia con el signo de dolar, la elimina del objeto. Si el valor analizado es un objeto anidado, la funcion se llama a si misma para procesar ese subnivel. Una vez completado el proceso de limpieza, llama a next() para continuar con el flujo de la aplicacion. Se implementa de forma manual para evitar conflictos de sobrescritura de propiedades que ocurren al usar paquetes de terceros en la version 5 de Express.
