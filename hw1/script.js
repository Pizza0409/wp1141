// JavaScript for Personal Website
class PersonalWebsite {
    constructor() {
        this.navMenu = document.querySelector('.nav-menu');
        this.hamburger = document.querySelector('.hamburger');
        this.skillBars = document.querySelectorAll('.skill-progress');
        this.contactForm = document.getElementById('contactForm');
        this.langToggle = document.getElementById('langToggle');
        this.currentLang = 'zh'; // Default language
        
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupScrollAnimations();
        this.setupSkillBars();
        this.setupContactForm();
        this.setupSmoothScrolling();
        this.setupNavbarScroll();
        this.setupLanguageToggle();
    }

    // Navigation functionality
    setupNavigation() {
        if (this.hamburger && this.navMenu) {
            this.hamburger.addEventListener('click', () => {
                this.hamburger.classList.toggle('active');
                this.navMenu.classList.toggle('active');
                
                // Add language switcher to mobile menu when active
                if (this.navMenu.classList.contains('active')) {
                    const languageSwitcher = document.querySelector('.language-switcher');
                    if (languageSwitcher && !this.navMenu.querySelector('.language-switcher')) {
                        this.navMenu.appendChild(languageSwitcher.cloneNode(true));
                    }
                }
            });

            // Close menu when clicking on nav links
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    this.hamburger.classList.remove('active');
                    this.navMenu.classList.remove('active');
                });
            });
        }
    }

    // Smooth scrolling for navigation links
    setupSmoothScrolling() {
        const navLinks = document.querySelectorAll('a[href^="#"]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                if (targetId) {
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        const offsetTop = targetElement.offsetTop - 70; // Account for fixed navbar
                        window.scrollTo({
                            top: offsetTop,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
    }

    // Navbar scroll effect
    setupNavbarScroll() {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 100) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            });
        }
    }

    // Scroll animations using Intersection Observer
    setupScrollAnimations() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Special handling for skill bars
                    if (entry.target.classList.contains('skill-progress')) {
                        this.animateSkillBar(entry.target);
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe elements for animation
        const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .skill-progress');
        animatedElements.forEach(el => {
            this.observer.observe(el);
        });
    }

    // Skill bars animation
    setupSkillBars() {
        this.skillBars.forEach(bar => {
            const width = bar.getAttribute('data-width');
            if (width) {
                bar.style.width = '0%';
            }
        });
    }

    animateSkillBar(element) {
        const width = element.getAttribute('data-width');
        if (width) {
            setTimeout(() => {
                element.style.width = width + '%';
            }, 200);
        }
    }

    // Contact form handling
    setupContactForm() {
        if (this.contactForm) {
            this.contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmission();
            });
        }
    }

    handleFormSubmission() {
        if (!this.contactForm) return;

        const formData = new FormData(this.contactForm);
        const contactData = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };

        // Validate form data
        if (this.validateForm(contactData)) {
            this.submitForm(contactData);
        }
    }

    validateForm(data) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!data.name.trim()) {
            this.showMessage('請輸入您的姓名', 'error');
            return false;
        }
        
        if (!data.email.trim() || !emailRegex.test(data.email)) {
            this.showMessage('請輸入有效的Email地址', 'error');
            return false;
        }
        
        if (!data.subject.trim()) {
            this.showMessage('請輸入主旨', 'error');
            return false;
        }
        
        if (!data.message.trim()) {
            this.showMessage('請輸入訊息內容', 'error');
            return false;
        }
        
        return true;
    }

    submitForm(data) {
        // Simulate form submission
        this.showMessage('訊息發送中...', 'info');
        
        setTimeout(() => {
            // In a real application, you would send the data to a server
            console.log('Form submitted:', data);
            this.showMessage('訊息已成功發送！我會盡快回覆您。', 'success');
            this.contactForm.reset();
        }, 1500);
    }

    showMessage(message, type) {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        
        // Style the message
        messageEl.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;
        
        // Set background color based on type
        switch (type) {
            case 'success':
                messageEl.style.backgroundColor = '#10b981';
                break;
            case 'error':
                messageEl.style.backgroundColor = '#ef4444';
                break;
            case 'info':
                messageEl.style.backgroundColor = '#3b82f6';
                break;
        }
        
        document.body.appendChild(messageEl);
        
        // Animate in
        setTimeout(() => {
            messageEl.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 5 seconds
        setTimeout(() => {
            messageEl.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(messageEl);
            }, 300);
        }, 5000);
    }

    // Typing animation for hero title
    startTypingAnimation() {
        const nameElement = document.querySelector('.hero .name');
        if (nameElement) {
            const text = nameElement.textContent || '';
            nameElement.textContent = '';
            
            let i = 0;
            const typeWriter = () => {
                if (i < text.length) {
                    nameElement.textContent += text.charAt(i);
                    i++;
                    setTimeout(typeWriter, 100);
                }
            };
            
            setTimeout(typeWriter, 1000);
        }
    }

    // Parallax effect for hero section
    setupParallax() {
        const hero = document.querySelector('.hero');
        if (hero) {
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                const rate = scrolled * -0.5;
                hero.style.transform = `translateY(${rate}px)`;
            });
        }
    }

    // Add hover effects to cards
    setupCardHovers() {
        const cards = document.querySelectorAll('.highlight, .timeline-content, .skill-items, .contact-form');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px)';
                card.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
            });
        });
    }

    // Language toggle functionality
    setupLanguageToggle() {
        if (this.langToggle) {
            this.langToggle.addEventListener('click', () => {
                this.toggleLanguage();
            });
        }
    }

    toggleLanguage() {
        this.currentLang = this.currentLang === 'zh' ? 'en' : 'zh';
        this.updateLanguage();
        this.langToggle.textContent = this.currentLang === 'zh' ? 'EN' : '中';
        
        // Force update nav logo after a short delay to ensure it's not overridden
        setTimeout(() => {
            const navLogo = document.querySelector('.nav-logo h2');
            if (navLogo && navLogo.hasAttribute('data-zh') && navLogo.hasAttribute('data-en')) {
                const text = this.currentLang === 'zh' ? 
                    navLogo.getAttribute('data-zh') : 
                    navLogo.getAttribute('data-en');
                navLogo.textContent = text;
                console.log('Nav logo force updated to:', text);
            }
        }, 100);
    }

    updateLanguage() {
        const elements = document.querySelectorAll('[data-zh][data-en]');
        elements.forEach(element => {
            const text = this.currentLang === 'zh' ? 
                element.getAttribute('data-zh') : 
                element.getAttribute('data-en');
            element.textContent = text;
        });
        
        // Update specific content that needs special handling
        this.updateSpecialContent();
        
        // Ensure nav logo is updated (in case it was missed)
        const navLogo = document.querySelector('.nav-logo h2');
        if (navLogo && navLogo.hasAttribute('data-zh') && navLogo.hasAttribute('data-en')) {
            const text = this.currentLang === 'zh' ? 
                navLogo.getAttribute('data-zh') : 
                navLogo.getAttribute('data-en');
            navLogo.textContent = text;
            console.log('Nav logo updated to:', text); // Debug log
        }
    }

    updateSpecialContent() {
        // Update about section content
        const aboutTexts = document.querySelectorAll('.about-text p');
        if (aboutTexts.length >= 2) {
            if (this.currentLang === 'zh') {
                aboutTexts[0].textContent = '我是一名對程式設計充滿熱忱的學生，目前就讀於國立臺灣大學。我對程式設計有著深厚的興趣，特別是關於機器學習、影像辨識以及網頁設計。';
                aboutTexts[1].textContent = '除了學術以外，我對於運動也很有興趣，目前規劃冬季要到日本進行受訓，並考取滑雪教練的證照，目前主要是往單板滑雪方向精進，滑雪這項運動培養了我的溝通技巧和領導能力。我相信這樣的經驗讓我成為一個更全面的專業人士。';
            } else {
                aboutTexts[0].textContent = 'I am a student passionate about programming, currently studying at National Taiwan University. I have a deep interest in programming, particularly in machine learning, image recognition, and web design.';
                aboutTexts[1].textContent = 'Beyond academics, I am also very interested in sports. I am currently planning to go to Japan for training this winter and obtain a ski instructor certification, focusing mainly on snowboarding. Skiing has developed my communication skills and leadership abilities. I believe this experience makes me a more well-rounded professional.';
            }
        }

        // Update highlight cards
        const highlights = document.querySelectorAll('.highlight');
        if (highlights.length >= 3) {
            if (this.currentLang === 'zh') {
                highlights[0].querySelector('h4').textContent = '機器學習';
                highlights[0].querySelector('p').textContent = '專精於影像辨識與深度學習，熱愛解決複雜的技術問題';
                highlights[1].querySelector('h4').textContent = '滑雪教練';
                highlights[1].querySelector('p').textContent = '規劃前往日本受訓，準備考取滑雪教練證照';
                highlights[2].querySelector('h4').textContent = '持續學習';
                highlights[2].querySelector('p').textContent = '保持對新技術的熱忱，不斷提升專業技能';
            } else {
                highlights[0].querySelector('h4').textContent = 'Machine Learning';
                highlights[0].querySelector('p').textContent = 'Specialized in image recognition and deep learning, passionate about solving complex technical problems';
                highlights[1].querySelector('h4').textContent = 'Snowboard Instructor';
                highlights[1].querySelector('p').textContent = 'Planning to go to Japan for training to obtain snowboard instructor certification';
                highlights[2].querySelector('h4').textContent = 'Continuous Learning';
                highlights[2].querySelector('p').textContent = 'Maintain enthusiasm for new technologies and continuously improve professional skills';
            }
        }

        // Update timeline content
        const timelineItems = document.querySelectorAll('.timeline-content');
        if (timelineItems.length >= 3) {
            if (this.currentLang === 'zh') {
                timelineItems[0].querySelector('h3').textContent = '滑雪教練';
                timelineItems[0].querySelector('.timeline-description').textContent = '冬季期間擔任滑雪教練，教授初學者滑雪技巧。培養了良好的溝通能力、耐心和領導技巧，這些技能也應用在團隊合作和專案管理中。';
                timelineItems[1].querySelector('h3').textContent = '國立臺灣大學';
                timelineItems[1].querySelector('h4').textContent = '工程科學及海洋工程學系暨研究所';
                timelineItems[1].querySelector('.timeline-description').textContent = '就讀國立臺灣大學工程科學及海洋工程學系暨研究所，目前碩士二年級，專精於程式設計、資料結構、演算法、系統設計等核心課程。積極參與專案開發，累積實務經驗。';
                timelineItems[2].querySelector('h3').textContent = '國立成功大學';
                timelineItems[2].querySelector('h4').textContent = '水利及海洋工程學系學系輔工程科學系';
                timelineItems[2].querySelector('.timeline-description').textContent = '在大學期間內除了本系上的課程外，因為對於程式設計有著濃厚的興趣所以選擇工程科學系作為輔系。在輔系期間內修習了許多程式設計相關的課程，包含程式設計、資料結構、作業系統等資工領域相關課程，在現階段奠定了不錯的程式基礎。';
            } else {
                timelineItems[0].querySelector('h3').textContent = 'Snowboard Instructor';
                timelineItems[0].querySelector('.timeline-description').textContent = 'Work as a snowboard instructor during winter, teaching skiing techniques to beginners. Developed excellent communication skills, patience and leadership skills, which are also applied in teamwork and project management.';
                timelineItems[1].querySelector('h3').textContent = 'National Taiwan University';
                timelineItems[1].querySelector('h4').textContent = 'Department and Graduate Institute of Engineering Science and Ocean Engineering';
                timelineItems[1].querySelector('.timeline-description').textContent = 'Studying in the Department and Graduate Institute of Engineering Science and Ocean Engineering at National Taiwan University, currently in second year of master\'s program, specializing in programming, data structures, algorithms, system design and other core courses. Actively participating in project development and accumulating practical experience.';
                timelineItems[2].querySelector('h3').textContent = 'National Cheng Kung University';
                timelineItems[2].querySelector('h4').textContent = 'Department of Hydraulic and Ocean Engineering, Minor in Engineering Science';
                timelineItems[2].querySelector('.timeline-description').textContent = 'During university, in addition to courses in my major, I chose Engineering Science as a minor due to my strong interest in programming. During the minor program, I studied many programming-related courses, including programming, data structures, operating systems and other computer science courses, establishing a solid programming foundation.';
            }
        }

        // Update skill categories
        const skillCategories = document.querySelectorAll('.skill-category h3');
        if (skillCategories.length >= 3) {
            if (this.currentLang === 'zh') {
                skillCategories[0].textContent = '程式語言';
                skillCategories[1].textContent = '技術框架';
                skillCategories[2].textContent = '軟技能';
            } else {
                skillCategories[0].textContent = 'Programming Languages';
                skillCategories[1].textContent = 'Technical Frameworks';
                skillCategories[2].textContent = 'Soft Skills';
            }
        }

        // Update skill items
        const skillItems = document.querySelectorAll('.skill-item span');
        if (skillItems.length >= 4) {
            if (this.currentLang === 'zh') {
                skillItems[0].textContent = '團隊合作';
                skillItems[1].textContent = '溝通能力';
                skillItems[2].textContent = '問題解決';
                skillItems[3].textContent = '教學指導';
            } else {
                skillItems[0].textContent = 'Teamwork';
                skillItems[1].textContent = 'Communication';
                skillItems[2].textContent = 'Problem Solving';
                skillItems[3].textContent = 'Teaching & Mentoring';
            }
        }

        // Update footer - use data attributes if available
        const footer = document.querySelector('.footer p');
        if (footer) {
            if (footer.hasAttribute('data-zh') && footer.hasAttribute('data-en')) {
                const text = this.currentLang === 'zh' ? 
                    footer.getAttribute('data-zh') : 
                    footer.getAttribute('data-en');
                footer.textContent = text;
            } else {
                // Fallback for elements without data attributes
                footer.textContent = this.currentLang === 'zh' ? 
                    '© 2025 羅筠笙. 保留所有權利.' : 
                    '© 2025 Yun-Sheng Lo. All rights reserved.';
            }
        }
    }
}

// Initialize the website when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const website = new PersonalWebsite();
    website.initializeAnimations();
    
    // Add loading animation
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        transition: opacity 0.5s ease;
    `;
    
    loader.innerHTML = `
        <div style="color: white; font-size: 2rem; font-weight: 600;">
            羅雲生
        </div>
    `;
    
    document.body.appendChild(loader);
    
    // Remove loader after page loads
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(loader);
            }, 500);
        }, 1000);
    });
});

// Add CSS for navbar scroll effect
const style = document.createElement('style');
style.textContent = `
    .navbar.scrolled {
        background: rgba(255, 255, 255, 0.98);
        box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
    }
    
    .navbar.scrolled .nav-logo h2 {
        color: #1e293b;
    }
    
    .navbar.scrolled .nav-link {
        color: #1e293b;
    }
    
    .navbar.scrolled .nav-link:hover {
        color: #60a5fa;
    }
    
    .navbar.scrolled .bar {
        background-color: #1e293b;
    }
    
    .navbar.scrolled .lang-btn {
        border-color: #1e293b;
        color: #1e293b;
    }
    
    .navbar.scrolled .lang-btn:hover {
        background: #1e293b;
        color: white;
    }
    
    .hamburger.active .bar:nth-child(2) {
        opacity: 0;
    }
    
    .hamburger.active .bar:nth-child(1) {
        transform: translateY(8px) rotate(45deg);
    }
    
    .hamburger.active .bar:nth-child(3) {
        transform: translateY(-8px) rotate(-45deg);
    }
`;
document.head.appendChild(style);
