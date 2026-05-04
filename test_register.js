const timestamp = Date.now();

const res = await fetch('http://localhost:3000/api/user/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: `test_${timestamp}@utad.com`,
        password: 'Password123',
        name: 'Test',
        lastName: 'Debug',
        nif: `NIF${timestamp}`
    })
});

console.log('Status:', res.status);
const data = await res.json();
console.log('Response:', JSON.stringify(data, null, 2));
