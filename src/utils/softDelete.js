export const softDeletePlugin = (schema) => {
    schema.add({
        deleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null }
    });

    const excludeDeleted = function () {
        if (!this.getOptions().withDeleted) {
            this.where({ deleted: { $ne: true } });
        }
    };

    schema.pre('find', excludeDeleted);
    schema.pre('findOne', excludeDeleted);
    schema.pre('findOneAndUpdate', excludeDeleted);
    schema.pre('countDocuments', excludeDeleted);

    schema.methods.softDelete = async function () {
        this.deleted = true;
        this.deletedAt = new Date();
        return this.save();
    };

    schema.methods.restore = async function () {
        this.deleted = false;
        this.deletedAt = null;
        return this.save();
    };
};