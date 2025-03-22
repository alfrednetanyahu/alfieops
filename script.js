// Global Chart Variables
let buyHoldChart = null;
let pieChart = null;

// Tab Switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelector('.tab.active').classList.remove('active');
        this.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        document.getElementById(this.dataset.tab).classList.remove('hidden');
    });
});

// Show/Hide Custom Pie Section & Sign-Up Form
document.getElementById('investmentType').addEventListener('change', function () {
    const isCustom = this.value === 'custom';
    document.getElementById('customPieSection').style.display = isCustom ? 'block' : 'none';
    document.getElementById('signupSection').style.display = isCustom ? 'block' : 'none';
});

// Add Stock to Custom Pie
document.getElementById('addStockBtn').addEventListener('click', function () {
    const pieBuilder = document.getElementById('pieBuilder');
    const row = document.createElement('div');
    row.classList.add('form-group');
    row.innerHTML = `
        <select class="stock-select">
            <option value="AAPL">Apple</option>
            <option value="MSFT">Microsoft</option>
            <option value="TSLA">Tesla</option>
        </select>
        <input type="number" class="stock-weight" placeholder="% Weight" min="1" max="100">
        <button type="button" onclick="this.parentElement.remove()">Remove</button>
    `;
    pieBuilder.appendChild(row);
});

// Update Charts on Form Submit
document.getElementById('investment-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const initialDeposit = parseFloat(document.getElementById('initial').value);
    const years = parseInt(document.getElementById('timeline').value);
    const investmentType = document.getElementById('investmentType').value;
    let returnRate = investmentType === 'index' ? 0.10 : 0.20;

    updateBuyHoldChart(initialDeposit, returnRate, years);
    updatePieChart();
});

// Update Buy & Hold Chart
function updateBuyHoldChart(initialDeposit, returnRate, years) {
    const ctx = document.getElementById('buyHoldChart').getContext('2d');

    if (buyHoldChart) buyHoldChart.destroy();

    let labels = [];
    let data = [];
    let value = initialDeposit;

    for (let i = 0; i <= years; i++) {
        labels.push(`Year ${i}`);
        data.push(value.toFixed(2));
        value *= (1 + returnRate);
    }

    buyHoldChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Buy & Hold Growth',
                data: data,
                borderColor: 'purple',
                backgroundColor: 'rgba(128, 0, 128, 0.2)',
                fill: true,
                tension: 0.1
            }]
        }
    });

    document.getElementById('buyHoldChart').parentElement.style.display = 'block';
}

// Update Pie Chart
function updatePieChart() {
    const ctx = document.getElementById('pieChart').getContext('2d');

    if (pieChart) pieChart.destroy();

    let labels = ['S&P 500'];
    let data = [100];
    let colors = ['#007BFF'];

    if (document.getElementById('investmentType').value === 'custom') {
        labels = Array.from(document.querySelectorAll('.stock-select')).map(sel => sel.value);
        data = Array.from(document.querySelectorAll('.stock-weight')).map(input => parseFloat(input.value));
        colors = labels.map(() => `hsl(${Math.random() * 360}, 70%, 60%)`);
    }

    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: colors }]
        }
    });

    document.getElementById('pieChart').parentElement.style.display = 'block';
}
