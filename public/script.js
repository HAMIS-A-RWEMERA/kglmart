let cart = [];

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    } else {
        console.error("Error: Could not find an element with id='cart-sidebar'");
    }
}

function updateUI() {
    const list = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total');
    const countEl = document.getElementById('cart-count');
    
    if (!list || !totalEl || !countEl) return;

    list.innerHTML = "";
    let total = 0;
    let totalItemsCount = 0;

    cart.forEach((item, index) => {
        // Calculate the total cost for this item line (Price x Quantity)
        const lineTotal = item.price * item.quantity;
        total += lineTotal;
        totalItemsCount += item.quantity;

        list.innerHTML += `
            <div class="cart-item" onclick="removeItem(${index})" style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #eee; cursor:pointer;">
                <span><strong>${item.name}</strong> <span style="color:#2e7d32; font-weight:bold;">(x${item.quantity})</span></span>
                <span>${lineTotal.toLocaleString()} RWF ❌</span>
            </div>
        `;
    });

    totalEl.innerText = total.toLocaleString();
    countEl.innerText = totalItemsCount; // Updates floating bubble with total item count
}

function addToCart(name, priceString, button) {
    const numericPrice = parseInt(priceString.replace(/[^0-9]/g, ''));
    
    if (isNaN(numericPrice)) {
        console.error("Could not read the price for:", name);
        return;
    }

    // Check if item already exists in the cart array
    const existingItem = cart.find(item => item.name === name);

    if (existingItem) {
        existingItem.quantity += 1; // Increase quantity instead of adding a new line
    } else {
        cart.push({ name, price: numericPrice, quantity: 1 }); // Save item tracking an explicit quantity
    }
    
    // Visual feedback
    const originalText = button.innerText;
    button.innerText = "✅ Added";
    button.style.background = "#ff9800";
    setTimeout(() => {
        button.innerText = originalText;
        button.style.background = "#2e7d32";
    }, 800);

    updateUI();
}

function removeItem(index) {
    if (cart[index].quantity > 1) {
        cart[index].quantity -= 1; // Decrease quantity counter by 1
    } else {
        cart.splice(index, 1); // Delete completely if it drops to 0
    }
    updateUI();
}

async function checkoutToWhatsApp() {
    if (cart.length === 0) return alert("Your cart is empty!");

    const totalStr = document.getElementById('cart-total').innerText;
    const totalNum = parseInt(totalStr.replace(/[^0-9]/g, ''));

    // 2. SAVE TO DATABASE 
    try {
        const response = await fetch('/api/place-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                cartItems: cart, 
                totalAmount: totalNum 
            })
        });
        const dbResult = await response.json();
        console.log("Order saved to SQL with ID:", dbResult.orderId);
    } catch (error) {
        console.error("Database save failed, but proceeding to WhatsApp...", error);
    }

    // 3. SEND TO WHATSAPP (Formatted list with quantity multipliers)
    let message = "Hello KGL Mart! I'd like to order:%0A%0A";
    cart.forEach((item, i) => {
        const lineTotal = item.price * item.quantity;
        message += `${i + 1}. ${item.name} (x${item.quantity}) - ${lineTotal.toLocaleString()} RWF%0A`;
    });
    
    message += `%0A*Total: ${totalStr} RWF*`;

    const whatsappUrl = `https://wa.me/250781603304?text=${message}`;
    window.open(whatsappUrl, '_blank');
}

document.addEventListener('DOMContentLoaded', () => {
    const allButtons = document.querySelectorAll('.product-card button');
    
    allButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            const nameEl = card.querySelector('h4');
            const priceEl = card.querySelector('p');

            if (nameEl && priceEl) {
                addToCart(nameEl.innerText, priceEl.innerText, button);
            } else {
                console.error("Could not find h4 or p inside this product-card");
            }
        });
    });

    const heroShopBtn = document.querySelector('.hero-buttons button:first-child');
    if (heroShopBtn) {
        heroShopBtn.addEventListener('click', () => {
            const productSection = document.getElementById('products');
            if(productSection) productSection.scrollIntoView({ behavior: 'smooth' });
        });
    }
});

function handleLocalSearch() {
    const searchFilter = document.getElementById('search-input').value.toLowerCase().trim();
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const productNameElement = card.querySelector('h4');
        
        if (productNameElement) {
            const productName = productNameElement.textContent.toLowerCase();

            if (productName.includes(searchFilter)) {
                card.style.display = ""; 
            } else {
                card.style.display = "none"; 
            }
        }
    });
}
