// backend/utils/passwordGenerator.js
function generateRandomPassword(length = 15) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const allChars = uppercase + lowercase + numbers;

    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];

    for (let i = 3; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Protresemo string da početni karakteri ne budu uvek istim redosledom
    return password.split('').sort(() => 0.5 - Math.random()).join('');
}

module.exports = generateRandomPassword;