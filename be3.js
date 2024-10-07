// DOM Elements
const elements = {
    listProductHTML: document.querySelector(".grid-container"),
    listCartHTML: document.querySelector(".cart-section"),
    iconCartSpan: document.querySelector("#cart-count"),
    confirmOrderBtn: document.getElementById("confirm-order-btn"),
    orderConfirmationModal: document.getElementById("order-confirmation-modal"),
    orderSummary: document.getElementById("order-summary"),
    newOrderBtn: document.getElementById("new-order-btn"),
};

// App State
const state = {
    listProducts: [],
    cart: {},
};

// Initialize app
const initApp = async () => {
    try {
        const products = await fetchProducts("data.json");
        state.listProducts = products;
        renderProducts();
    } catch (error) {
        console.error("Failed to fetch products:", error);
    }
};

// Fetch products
const fetchProducts = async (url) => {
    const response = await fetch(url);
    return response.json();
};

// Render products to HTML
const renderProducts = () => {
    elements.listProductHTML.innerHTML = ""; // Clear previous products
    state.listProducts.forEach(product => {
        const productCard = createProductCard(product);
        elements.listProductHTML.appendChild(productCard);
    });
    attachProductListeners();
};

// Create product card HTML
const createProductCard = (product) => {
    const productCard = document.createElement("div");
    productCard.classList.add("card");
    productCard.dataset.name = product.name;
    productCard.innerHTML = `
        <img class="card-image" src="${product.image.desktop}" alt="${product.name}">
        <button class="add-to-cart-button">
            <img src="assets/images/icon-add-to-cart.svg" alt="cart icon"> Add to cart
        </button>
        <div class="quantity-selector hidden">
            <button class="icon-decrement">-</button>
            <span>1</span>
            <button class="icon-increment">+</button>
        </div>
        <p class="toLeft">${product.category}</p>
        <h2 class="product-name">${product.name}</h2>
        <h3 class="price">$${product.price.toFixed(2)}</h3>
    `;
    return productCard;
};

// Attach listeners to product buttons
const attachProductListeners = () => {
    document.querySelectorAll(".add-to-cart-button").forEach(button => {
        button.addEventListener("click", handleAddToCart);
    });
    document.querySelectorAll(".icon-increment, .icon-decrement").forEach(button => {
        button.addEventListener("click", handleQuantityChange);
    });
};

// Handle add to cart
const handleAddToCart = (event) => {
    const productCard = event.target.closest(".card");
    const productName = productCard.dataset.name;
    const productPrice = parseFloat(productCard.querySelector(".price").textContent.replace('$', ''));

    toggleAddToCartButton(productCard, true);
    updateCart(productName, productPrice, 1);
    updateCartDisplay();
};

// Update cart
const updateCart = (productName, price, quantity) => {
    state.cart[productName] = state.cart[productName] || { quantity: 0, price };
    state.cart[productName].quantity += quantity;
};

// Toggle add to cart button
const toggleAddToCartButton = (productCard, hide) => {
    productCard.querySelector(".add-to-cart-button").classList.toggle("hidden", hide);
    productCard.querySelector(".quantity-selector").classList.toggle("hidden", !hide);
};

// Handle quantity change
const handleQuantityChange = (event) => {
    const button = event.target;
    const counterDiv = button.closest(".quantity-selector");
    const productCard = button.closest(".card");
    const productName = productCard.dataset.name;

    let currentQuantity = parseInt(counterDiv.querySelector("span").textContent);
    currentQuantity = button.classList.contains("icon-increment") ? currentQuantity + 1 : Math.max(1, currentQuantity - 1);

    counterDiv.querySelector("span").textContent = currentQuantity;
    updateCartQuantity(productName, productCard, currentQuantity);
};

// Update cart quantity or remove item
const updateCartQuantity = (productName, productCard, quantity) => {
    state.cart[productName].quantity = quantity;

    if (quantity === 1 && productCard.querySelector(".icon-decrement").clicked) {
        delete state.cart[productName];
        toggleAddToCartButton(productCard, false);
    }
    updateCartDisplay();
};

// Update cart display
const updateCartDisplay = () => {
    const cart = Object.values(state.cart);
    const totalQuantity = cart.reduce((sum, { quantity }) => sum + quantity, 0);
    const totalPrice = cart.reduce((sum, { quantity, price }) => sum + quantity * price, 0);

    renderCart(cart, totalQuantity, totalPrice);
    elements.iconCartSpan.textContent = totalQuantity;
    elements.confirmOrderBtn.hidden = totalQuantity === 0;
};

// Render cart items
const renderCart = (cart, totalQuantity, totalPrice) => {
    elements.listCartHTML.innerHTML = totalQuantity === 0
        ? `<img src="/assets/images/illustration-empty-cart.svg" alt="empty cart"/><p>Your added items will appear here.</p>`
        : `<h1>Your Cart (${totalQuantity})</h1>` + cart.map(renderCartItem).join("") + `<h3>Order Total: $${totalPrice.toFixed(2)}</h3>`;
};

// Render individual cart item
const renderCartItem = ({ name, quantity, price }) => `
    <div class="cart-item">
        <h2>${name}</h2>
        <div class="pdcs-infos">
            <p class="product-quantity">${quantity}X</p>
            <p class="single-price">@$${price.toFixed(2)}</p>
            <p class="total-price">$${(price * quantity).toFixed(2)}</p>
            <button class="remove-from-cart" data-name="${name}">
                <img src="/assets/images/icon-remove-item.svg" alt="remove icon"/>
            </button>
        </div>
    </div>
`;

// Handle confirm order
elements.confirmOrderBtn.addEventListener("click", () => {
    renderOrderSummary();
    toggleModalVisibility(elements.orderConfirmationModal);
});

// Render order summary in modal
const renderOrderSummary = () => {
    const summaryHTML = Object.entries(state.cart).map(([name, { quantity, price }]) => `
        <div class="order-summary-item">
            <img src="${state.listProducts.find(p => p.name === name).image.desktop}" alt="${name}" />
            <p>${name}</p>
            <p>Quantity: ${quantity}</p>
            <p>Price: $${price.toFixed(2)}</p>
            <p>Total: $${(price * quantity).toFixed(2)}</p>
        </div>
    `).join("");

    const total = Object.values(state.cart).reduce((sum, { price, quantity }) => sum + price * quantity, 0);
    elements.orderSummary.innerHTML = `
        <div class="order-confirmation-header">
            <img src="/assets/images/icon-order-confirmed.svg" alt="Order Confirmed"/>
            <h2>Order Confirmed</h2>
            <p>We hope you enjoy your food!</p>
        </div>
        ${summaryHTML}
        <h3>Order Total: $${total.toFixed(2)}</h3>
        <button class="new-order-btn">New Order</button>
    `;
    elements.orderSummary.querySelector(".new-order-btn").addEventListener("click", handleNewOrder);
};

// Handle new order
const handleNewOrder = () => {
    state.cart = {};
    updateCartDisplay();
    toggleModalVisibility(elements.orderConfirmationModal);
    document.querySelectorAll(".card").forEach(card => toggleAddToCartButton(card, false));
};

// Toggle modal visibility
const toggleModalVisibility = (modal) => {
    modal.classList.toggle("hidden");
};

// Start app
initApp();
