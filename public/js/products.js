/**
 * MSUKASHA B2B - Products Page
 * File Path: public/js/products.js
 */
async function loadProducts() {
    try {
        const res = await fetch('/api/vendor/products', { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) return;

        const container = document.getElementById('productsContainer') || document.getElementById('productsList');
        if (!container) return;

        if (data.count === 0) {
            container.innerHTML = '<p style="text-align:center;color:#64748b;padding:40px">Koi product nahi mila. Pehla product add karein!</p>';
            return;
        }

        container.innerHTML = data.data.map(p => `
            <div class="product-card" data-id="${p._id}">
                <img src="${p.imagePath || '/img/no-image.png'}" alt="${p.name}" onerror="this.src='/img/no-image.png'">
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <p>${p.category}</p>
                    <strong>Rs. ${Number(p.price).toLocaleString()}</strong>
                    <span>MOQ: ${p.moq} units</span>
                </div>
                <button onclick="deleteProduct('${p._id}')" class="btn-delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    } catch (e) {
        console.error('Products load error:', e);
    }
}

async function deleteProduct(id) {
    if (!confirm('Is product ko delete karna chahte hain?')) return;
    try {
        const res = await fetch('/api/vendor/products/' + id, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
            loadProducts();
        } else {
            alert(data.message || 'Delete failed');
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

document.addEventListener('DOMContentLoaded', loadProducts);
