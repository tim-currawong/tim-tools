/**
 * Tim-Tools - Shared JavaScript Module
 * Common utilities, theming, navigation, and URL state management
 */

const TimTools = {
  // Calculator registry for cross-calculator linking
  calculators: {
    'wire-gauge': {
      name: 'Wire Gauge Calculator',
      path: 'wire-gauge.html',
      accepts: ['current']
    },
    'battery-config': {
      name: 'Battery Configuration',
      path: 'battery-config.html',
      accepts: ['voltage', 'capacity']
    },
    'unit-converter': {
      name: 'Unit Converter',
      path: 'unit-converter.html',
      accepts: []
    }
  },

  // Initialize theme based on system preference or saved preference
  initTheme() {
    const saved = localStorage.getItem('tim-tools-theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('tim-tools-theme')) {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    });
  },

  // Toggle theme manually
  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('tim-tools-theme', next);
  },

  // URL State Management
  state: {
    // Get all parameters from URL
    getAll() {
      const params = new URLSearchParams(window.location.search);
      const state = {};
      for (const [key, value] of params) {
        // Try to parse as number, otherwise keep as string
        const num = parseFloat(value);
        state[key] = isNaN(num) ? value : num;
      }
      return state;
    },

    // Get a single parameter
    get(key, defaultValue = null) {
      const params = new URLSearchParams(window.location.search);
      const value = params.get(key);
      if (value === null) return defaultValue;
      const num = parseFloat(value);
      return isNaN(num) ? value : num;
    },

    // Set multiple parameters and update URL
    set(newState) {
      const params = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(newState)) {
        if (value !== null && value !== undefined && value !== '') {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', newUrl);
    },

    // Get shareable URL
    getShareUrl() {
      return window.location.href;
    },

    // Copy current URL to clipboard
    async copyShareUrl() {
      try {
        await navigator.clipboard.writeText(this.getShareUrl());
        TimTools.showToast('Link copied to clipboard!', 'success');
        return true;
      } catch (err) {
        console.error('Failed to copy:', err);
        TimTools.showToast('Failed to copy link', 'error');
        return false;
      }
    }
  },

  // Toast notifications
  showToast(message, type = 'info') {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Remove after delay
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  // Generate links to other calculators that accept a given value type
  generateUseInLinks(valueType, value) {
    const links = [];
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');

    for (const [id, calc] of Object.entries(this.calculators)) {
      if (id !== currentPage && calc.accepts.includes(valueType)) {
        const url = new URL(calc.path, window.location.href.replace(/[^/]*$/, ''));
        url.searchParams.set(valueType, value);
        links.push({
          name: calc.name,
          url: url.toString()
        });
      }
    }
    return links;
  },

  // Mobile menu handling
  initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');

    if (menuBtn && sidebar) {
      menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
      });

      // Close on click outside
      document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
          sidebar.classList.remove('mobile-open');
        }
      });
    }
  },

  // Search functionality
  initSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    
    searchInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        this.filterCalculators(query);
      });
    });
  },

  filterCalculators(query) {
    // Filter nav items in sidebar
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(query) || query === '' ? '' : 'none';
    });

    // Filter calculator cards on homepage
    const cards = document.querySelectorAll('.calc-card');
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(query) || query === '' ? '' : 'none';
    });

    // Show/hide category titles based on visible items
    const categories = document.querySelectorAll('.nav-category');
    categories.forEach(cat => {
      const visibleItems = cat.querySelectorAll('.nav-item:not([style*="display: none"])');
      cat.style.display = visibleItems.length > 0 || query === '' ? '' : 'none';
    });
  },

  // Advanced settings toggle
  initAdvancedToggle() {
    const toggles = document.querySelectorAll('.advanced-toggle');
    
    toggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('open');
        const content = toggle.nextElementSibling;
        if (content && content.classList.contains('advanced-content')) {
          content.classList.toggle('open');
        }
      });
    });
  },

  // Input validation
  validateInput(value, min, max, type = 'number') {
    if (type === 'number') {
      const num = parseFloat(value);
      if (isNaN(num)) return { valid: false, error: 'Please enter a valid number' };
      if (min !== undefined && num < min) return { valid: false, error: `Minimum value is ${min}` };
      if (max !== undefined && num > max) return { valid: false, error: `Maximum value is ${max}` };
      return { valid: true, value: num };
    }
    return { valid: true, value };
  },

  // Format numbers nicely
  formatNumber(num, decimals = 1) {
    if (num === null || num === undefined || isNaN(num)) return '—';
    if (num >= 1000000) return (num / 1000000).toFixed(decimals) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(decimals) + 'k';
    return num.toFixed(decimals);
  },

  // Debounce helper for real-time updates
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Smooth value interpolation for animations
  lerp(start, end, factor) {
    return start + (end - start) * factor;
  },

  // Initialize all common functionality
  init() {
    this.initTheme();
    this.initMobileMenu();
    this.initSearch();
    this.initAdvancedToggle();
  }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => TimTools.init());

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TimTools;
}
