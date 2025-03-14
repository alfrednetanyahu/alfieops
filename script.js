let chart; // Global chart instance

document.getElementById('investment-form').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent page reload

    // Get user inputs
    const years = parseInt(document.getElementById('timeline').value);
    const amount = parseFloat(document.getElementById('amount').value);
    const frequency = document.getElementById('frequency').value;
    const index = document.getElementById('index').value;

    // Set annual return rate based on index choice
    let annualReturnRate = 0.10; // Default for S&P 500
    if (index === 'qqq') annualReturnRate = 0.12;

    let periods = frequency === 'monthly' ? years * 12 : years;
    let effectiveRate = frequency === 'monthly' ? Math.pow(1 + annualReturnRate, 1 / 12) - 1 : annualReturnRate;

    let futureValue = 0;
    const dataPoints = [];
    const labels = [];

    for (let i = 1; i <= periods; i++) {
        futureValue = (futureValue + amount) * (1 + effectiveRate);
        if (frequency === 'monthly' && i % 12 === 0) {
            labels.push(`Year ${i / 12}`);
            dataPoints.push(futureValue.toFixed(2));
        } else if (frequency === 'yearly') {
            labels.push(`Year ${i}`);
            dataPoints.push(futureValue.toFixed(2));
        }
    }

    futureValue = futureValue.toFixed(2);

    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
        <h3>Simulation Result</h3>
        <p>Final Value: <strong>$${futureValue}</strong></p>
    `;

    // Render Chart
    if (chart) chart.destroy(); // Destroy existing chart
    const ctx = document.getElementById('investmentChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Investment Growth Over Time',
                data: dataPoints,
                fill: true,
                borderColor: 'green',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
});
