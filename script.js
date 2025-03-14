let chart; // Global chart instance

document.getElementById('investment-form').addEventListener('submit', function (e) {
    e.preventDefault();

    // Inputs
    const initialDeposit = parseFloat(document.getElementById('initial').value);
    const years = parseInt(document.getElementById('timeline').value);
    const amount = parseFloat(document.getElementById('amount').value);
    const frequency = document.getElementById('frequency').value;
    const index = document.getElementById('index').value;
    const contributionTiming = document.getElementById('contributionTiming').value;

    // Rates
    let annualReturnRate = 0.10;
    if (index === 'qqq') annualReturnRate = 0.12;
    if (index === 'magnificent7') annualReturnRate = 0.15;

    let periods = frequency === 'monthly' ? years * 12 : years;
    let effectiveRate = frequency === 'monthly' ? Math.pow(1 + annualReturnRate, 1 / 12) - 1 : annualReturnRate;

    let totalValue = initialDeposit;
    let totalInvested = initialDeposit;
    const growthData = [];
    const investedData = [];
    const labels = [];

    for (let i = 1; i <= periods; i++) {
        if (contributionTiming === 'beginning') {
            totalValue += amount; // Add contribution first
        }

        totalValue *= (1 + effectiveRate); // Apply growth

        if (contributionTiming === 'end') {
            totalValue += amount; // Add contribution after growth
        }

        totalInvested += amount;

        // Only push yearly data for monthly contributions to avoid clutter
        if (frequency === 'monthly' && i % 12 === 0) {
            labels.push(`Year ${i / 12}`);
            growthData.push((totalValue - totalInvested).toFixed(2));
            investedData.push(totalInvested.toFixed(2));
        } else if (frequency === 'yearly') {
            labels.push(`Year ${i}`);
            growthData.push((totalValue - totalInvested).toFixed(2));
            investedData.push(totalInvested.toFixed(2));
        }
    }

    totalValue = totalValue.toFixed(2);

    // Display result
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `<h3>Estimated Value: $${totalValue}</h3><p>Total Invested: $${totalInvested.toFixed(2)}</p>`;

    // Render chart
    if (chart) chart.destroy(); // Destroy existing chart
    const ctx = document.getElementById('investmentChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Invested Amount',
                    data: investedData,
                    borderColor: 'blue',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: true,
                    tension: 0.1
                },
                {
                    label: 'Growth (Interest)',
                    data: growthData,
                    borderColor: 'green',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
});
