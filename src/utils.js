export const generateUniqueCode = () => {
    return 'TASK-' + Math.random().toString(36).substr(2, 9).toUpperCase();
};
