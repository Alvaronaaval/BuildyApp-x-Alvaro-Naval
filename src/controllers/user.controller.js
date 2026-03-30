export const register = async (req, res) => {
    const { email, password } = req.body;

    console.log(`Intentando registrar usuario: ${email}`);
    res.status(201).json({
        mensaje: 'Usuario registrado',
        datos: { email }
    });
};