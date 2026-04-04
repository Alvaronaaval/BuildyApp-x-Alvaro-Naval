import multer from 'multer';
import path from 'path';

// Configuración de almacenamiento en disco
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Guarda los archivos en la carpeta uploads en la raíz de tu proyecto
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Genera un nombre único: prefijo + fecha + extensión original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Formato no válido. Solo se permiten imágenes.'), false);
    }
};

// Exportamos el middleware configurado con el límite de 5MB
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});