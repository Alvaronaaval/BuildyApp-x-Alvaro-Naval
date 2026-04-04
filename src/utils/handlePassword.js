import bcryptjs from 'bcryptjs';

export const encrypt = async (clearPassword) => {
    return await bcryptjs.hash(clearPassword, 10);
};

export const compare = async (clearPassword, hashedPassword) => {
    return await bcryptjs.compare(clearPassword, hashedPassword);
};