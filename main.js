/**
 * MSUKASHA B2B Seller Portal - Upgraded Interactive Frontend Engine
 * File Path: public/js/main.js
 */

document.addEventListener("DOMContentLoaded", () => {
    const currentPath = window.location.pathname;

    // 1. Sidebar Link Active Highlighting Guard
    const sidebarLinks = document.querySelectorAll('.sidebar-menu li a');
    sidebarLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.parentElement.classList.add('active');
        } else {
            link.parentElement.classList.remove('active');
        }
    });

    // 2. Dashboard Counter Rolling Metric Up Animation
    if (currentPath === "/dashboard" || currentPath.includes("dashboard")) {
        const statNumbers = document.querySelectorAll('.stat-info p');
        statNumbers.forEach(stat => {
            const rawText = stat.innerText;
            const targetNumber = parseInt(rawText.replace(/[^0-9]/g, ''));
            const isCurrency = rawText.includes('Rs.');
            let currentCount = 0;
            const increments = targetNumber / 30;

            const rollCounter = () => {
                if (currentCount < targetNumber) {
                    currentCount += Math.ceil(increments);
                    if (currentCount > targetNumber) currentCount = targetNumber;
                    stat.innerText = isCurrency 
                        ? `Rs. ${currentCount.toLocaleString()}` 
                        : `${currentCount.toLocaleString()} Orders`;
                    setTimeout(rollCounter, 20);
                }
            };
            rollCounter();
        });
    }

    // 3. Prevent Double Submit Crash Locks
    const b2bForms = document.querySelectorAll('.auth-form');
    b2bForms.forEach(form => {
        form.addEventListener('submit', () => {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.style.opacity = '0.7';
                submitBtn.style.pointerEvents = 'none';
                submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing Corporate Request...`;
            }
        });
    });

    // 4. Real-Time Dynamic Tier Pricing Logic Engine
    if (currentPath.includes("add-product")) {
        const moqInput = document.querySelector('input[name="moq"]');
        const priceInput = document.querySelector('input[name="base_price"]');
        const t1 = document.getElementById('tier_1');
        const t2 = document.getElementById('tier_2');

        const calculateLiveTiers = () => {
            const moq = parseInt(moqInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            if (moq > 0 && price > 0) {
                t1.placeholder = `If order > ${moq * 2} Units, Price = Rs. ${Math.round(price * 0.9)} /unit`;
                t2.placeholder = `If order > ${moq * 5} Units, Price = Rs. ${Math.round(price * 0.8)} /unit`;
            }
        };
        moqInput.addEventListener('input', calculateLiveTiers);
        priceInput.addEventListener('input', calculateLiveTiers);
    }

    // 5. Live Search Filter Table Layer Engine
    const searchBox = document.getElementById('orderSearch');
    const statusSelect = document.getElementById('statusFilter');
    if (searchBox || statusSelect) {
        const filterTableLogic = () => {
            const searchVal = searchBox ? searchBox.value.toLowerCase() : "";
            const statusVal = statusSelect ? statusSelect.value.toLowerCase() : "";
            const rows = document.querySelectorAll('.b2b-table tbody tr');

            rows.forEach(row => {
                const textMatch = row.cells[2].innerText.toLowerCase().includes(searchVal) || row.cells[3].innerText.toLowerCase().includes(searchVal);
                const statusMatch = statusVal === "" || row.cells[6].innerText.toLowerCase().includes(statusVal);
                row.style.display = (textMatch && statusMatch) ? "" : "none";
            });
        };
        if (searchBox) searchBox.addEventListener('input', filterTableLogic);
        if (statusSelect) statusSelect.addEventListener('change', filterTableLogic);
    }
});