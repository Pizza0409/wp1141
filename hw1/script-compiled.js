// TypeScript for Personal Website
var PersonalWebsite = /** @class */ (function () {
    function PersonalWebsite() {
        this.navMenu = document.querySelector('.nav-menu');
        this.hamburger = document.querySelector('.hamburger');
        this.skillBars = document.querySelectorAll('.skill-progress');
        this.contactForm = document.getElementById('contactForm');
        this.langToggle = document.getElementById('langToggle');
        this.currentLang = 'zh'; // Default language
        this.init();
    }
    PersonalWebsite.prototype.init = function () {
        this.setupNavigation();
        this.setupScrollAnimations();
        this.setupSkillBars();
        this.setupContactForm();
        this.setupSmoothScrolling();
        this.setupNavbarScroll();
        this.setupLanguageToggle();
        this.setupBackToTop();
        this.setupPageNavigation();
    };
    // Navigation functionality
    PersonalWebsite.prototype.setupNavigation = function () {
        var _this = this;
        if (this.hamburger && this.navMenu) {
            this.hamburger.addEventListener('click', function () {
                var _a, _b, _c;
                (_a = _this.hamburger) === null || _a === void 0 ? void 0 : _a.classList.toggle('active');
                (_b = _this.navMenu) === null || _b === void 0 ? void 0 : _b.classList.toggle('active');
                // Add language switcher to mobile menu when active
                if ((_c = _this.navMenu) === null || _c === void 0 ? void 0 : _c.classList.contains('active')) {
                    var languageSwitcher = document.querySelector('.language-switcher');
                    if (languageSwitcher && !_this.navMenu.querySelector('.language-switcher')) {
                        _this.navMenu.appendChild(languageSwitcher.cloneNode(true));
                    }
                }
            });
            // Close menu when clicking on nav links
            var navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(function (link) {
                link.addEventListener('click', function () {
                    var _a, _b;
                    (_a = _this.hamburger) === null || _a === void 0 ? void 0 : _a.classList.remove('active');
                    (_b = _this.navMenu) === null || _b === void 0 ? void 0 : _b.classList.remove('active');
                });
            });
        }
    };
    // Smooth scrolling for navigation links
    PersonalWebsite.prototype.setupSmoothScrolling = function () {
        var navLinks = document.querySelectorAll('a[href^="#"]');
        navLinks.forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                var targetId = link.getAttribute('href');
                if (targetId) {
                    var targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        var offsetTop = targetElement.offsetTop - 70; // Account for fixed navbar
                        window.scrollTo({
                            top: offsetTop,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
    };
    // Navbar scroll effect
    PersonalWebsite.prototype.setupNavbarScroll = function () {
        var navbar = document.querySelector('.navbar');
        if (navbar) {
            window.addEventListener('scroll', function () {
                if (window.scrollY > 100) {
                    navbar.classList.add('scrolled');
                }
                else {
                    navbar.classList.remove('scrolled');
                }
            });
        }
    };
    // Scroll animations using Intersection Observer
    PersonalWebsite.prototype.setupScrollAnimations = function () {
        var _this = this;
        this.observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Special handling for skill bars
                    if (entry.target.classList.contains('skill-progress')) {
                        _this.animateSkillBar(entry.target);
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        // Observe elements for animation
        var animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .skill-progress');
        animatedElements.forEach(function (el) {
            _this.observer.observe(el);
        });
    };
    // Skill bars animation
    PersonalWebsite.prototype.setupSkillBars = function () {
        this.skillBars.forEach(function (bar) {
            var width = bar.getAttribute('data-width');
            if (width) {
                bar.style.width = '0%';
            }
        });
    };
    PersonalWebsite.prototype.animateSkillBar = function (element) {
        var width = element.getAttribute('data-width');
        if (width) {
            setTimeout(function () {
                element.style.width = width + '%';
            }, 200);
        }
    };
    // Contact form handling
    PersonalWebsite.prototype.setupContactForm = function () {
        var _this = this;
        if (this.contactForm) {
            this.contactForm.addEventListener('submit', function (e) {
                e.preventDefault();
                _this.handleFormSubmission();
            });
        }
    };
    PersonalWebsite.prototype.handleFormSubmission = function () {
        if (!this.contactForm)
            return;
        var formData = new FormData(this.contactForm);
        var contactData = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };
        // Validate form data
        if (this.validateForm(contactData)) {
            this.submitForm(contactData);
        }
    };
    PersonalWebsite.prototype.validateForm = function (data) {
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
    };
    PersonalWebsite.prototype.submitForm = function (data) {
        var _this = this;
        // Simulate form submission
        this.showMessage('訊息發送中...', 'info');
        setTimeout(function () {
            var _a;
            // In a real application, you would send the data to a server
            console.log('Form submitted:', data);
            _this.showMessage('訊息已成功發送！我會盡快回覆您。', 'success');
            (_a = _this.contactForm) === null || _a === void 0 ? void 0 : _a.reset();
        }, 1500);
    };
    PersonalWebsite.prototype.showMessage = function (message, type) {
        // Create message element
        var messageEl = document.createElement('div');
        messageEl.className = "message message-".concat(type);
        messageEl.textContent = message;
        // Style the message
        messageEl.style.cssText = "\n            position: fixed;\n            top: 100px;\n            right: 20px;\n            padding: 15px 20px;\n            border-radius: 8px;\n            color: white;\n            font-weight: 500;\n            z-index: 10000;\n            transform: translateX(100%);\n            transition: transform 0.3s ease;\n            max-width: 300px;\n        ";
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
        setTimeout(function () {
            messageEl.style.transform = 'translateX(0)';
        }, 100);
        // Remove after 5 seconds
        setTimeout(function () {
            messageEl.style.transform = 'translateX(100%)';
            setTimeout(function () {
                document.body.removeChild(messageEl);
            }, 300);
        }, 5000);
    };
    // Typing animation for hero title
    PersonalWebsite.prototype.startTypingAnimation = function () {
        var nameElement = document.querySelector('.hero .name');
        if (nameElement) {
            var text_1 = nameElement.textContent || '';
            nameElement.textContent = '';
            var i_1 = 0;
            var typeWriter_1 = function () {
                if (i_1 < text_1.length) {
                    nameElement.textContent += text_1.charAt(i_1);
                    i_1++;
                    setTimeout(typeWriter_1, 100);
                }
            };
            setTimeout(typeWriter_1, 1000);
        }
    };
    // Parallax effect for hero section
    PersonalWebsite.prototype.setupParallax = function () {
        var hero = document.querySelector('.hero');
        if (hero) {
            window.addEventListener('scroll', function () {
                var scrolled = window.pageYOffset;
                var rate = scrolled * -0.5;
                hero.style.transform = "translateY(".concat(rate, "px)");
            });
        }
    };
    // Add hover effects to cards
    PersonalWebsite.prototype.setupCardHovers = function () {
        var cards = document.querySelectorAll('.highlight, .timeline-content, .skill-items, .contact-form');
        cards.forEach(function (card) {
            card.addEventListener('mouseenter', function () {
                card.style.transform = 'translateY(-5px)';
                card.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
            });
            card.addEventListener('mouseleave', function () {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
            });
        });
    };
    // Language toggle functionality
    PersonalWebsite.prototype.setupLanguageToggle = function () {
        var _this = this;
        if (this.langToggle) {
            this.langToggle.addEventListener('click', function () {
                _this.toggleLanguage();
            });
        }
    };
    PersonalWebsite.prototype.setupBackToTop = function () {
        var backToTopBtn = document.getElementById('backToTop');
        if (!backToTopBtn)
            return;
        // Show/hide button based on scroll position
        window.addEventListener('scroll', function () {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('visible');
            }
            else {
                backToTopBtn.classList.remove('visible');
            }
        });
        // Scroll to top when clicked
        backToTopBtn.addEventListener('click', function () {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    };
    PersonalWebsite.prototype.setupPageNavigation = function () {
        var pageNav = document.getElementById('pageNav');
        if (!pageNav)
            return;
        var navToggle = pageNav.querySelector('.page-nav-toggle');
        var navMenu = pageNav.querySelector('.page-nav-menu');
        if (!navToggle || !navMenu)
            return;
        // Toggle navigation menu
        navToggle.addEventListener('click', function () {
            pageNav.classList.toggle('active');
        });
        // Close menu when clicking outside
        document.addEventListener('click', function (e) {
            if (!pageNav.contains(e.target)) {
                pageNav.classList.remove('active');
            }
        });
        // Close menu when clicking on nav items
        var navItems = navMenu.querySelectorAll('.page-nav-item');
        navItems.forEach(function (item) {
            item.addEventListener('click', function () {
                pageNav.classList.remove('active');
            });
        });
        // Update active nav item based on scroll position
        window.addEventListener('scroll', function () {
            var sections = document.querySelectorAll('section[id]');
            var scrollPos = window.pageYOffset + 100;
            sections.forEach(function (section) {
                var sectionTop = section.offsetTop;
                var sectionHeight = section.offsetHeight;
                var sectionId = section.getAttribute('id');
                if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                    navItems.forEach(function (item) {
                        item.classList.remove('active');
                        if (item.getAttribute('href') === "#".concat(sectionId)) {
                            item.classList.add('active');
                        }
                    });
                }
            });
        });
    };
    PersonalWebsite.prototype.toggleLanguage = function () {
        var _this = this;
        this.currentLang = this.currentLang === 'zh' ? 'en' : 'zh';
        this.updateLanguage();
        if (this.langToggle) {
            this.langToggle.textContent = this.currentLang === 'zh' ? 'EN' : '中';
        }
        // Force update nav logo after a short delay to ensure it's not overridden
        setTimeout(function () {
            var navLogo = document.querySelector('.nav-logo h2');
            if (navLogo && navLogo.hasAttribute('data-zh') && navLogo.hasAttribute('data-en')) {
                var text = _this.currentLang === 'zh' ?
                    navLogo.getAttribute('data-zh') :
                    navLogo.getAttribute('data-en');
                if (text) {
                    navLogo.textContent = text;
                    console.log('Nav logo force updated to:', text);
                }
            }
        }, 100);
    };
    PersonalWebsite.prototype.updateLanguage = function () {
        var _this = this;
        var elements = document.querySelectorAll('[data-zh][data-en]');
        elements.forEach(function (element) {
            var text = _this.currentLang === 'zh' ?
                element.getAttribute('data-zh') :
                element.getAttribute('data-en');
            if (text) {
                element.textContent = text;
            }
        });
        // Update specific content that needs special handling
        this.updateSpecialContent();
        // Ensure nav logo is updated (in case it was missed)
        var navLogo = document.querySelector('.nav-logo h2');
        if (navLogo && navLogo.hasAttribute('data-zh') && navLogo.hasAttribute('data-en')) {
            var text = this.currentLang === 'zh' ?
                navLogo.getAttribute('data-zh') :
                navLogo.getAttribute('data-en');
            if (text) {
                navLogo.textContent = text;
                console.log('Nav logo updated to:', text); // Debug log
            }
        }
    };
    PersonalWebsite.prototype.updateSpecialContent = function () {
        var _this = this;
        // Update about section content
        var aboutTexts = document.querySelectorAll('.about-text p');
        if (aboutTexts.length >= 2) {
            if (this.currentLang === 'zh') {
                aboutTexts[0].textContent = '我是一名對程式設計充滿熱忱的學生，目前就讀於國立臺灣大學。我對程式設計有著深厚的興趣，特別是關於機器學習、影像辨識以及網頁設計。';
                aboutTexts[1].textContent = '除了學術以外，我對於運動也很有興趣，目前規劃冬季要到日本進行受訓，並考取滑雪教練的證照，目前主要是往單板滑雪方向精進，滑雪這項運動培養了我的溝通技巧和領導能力。我相信這樣的經驗讓我成為一個更全面的專業人士。';
            }
            else {
                aboutTexts[0].textContent = 'I am a student passionate about programming, currently studying at National Taiwan University. I have a deep interest in programming, particularly in machine learning, image recognition, and web design.';
                aboutTexts[1].textContent = 'Beyond academics, I am also very interested in sports. I am currently planning to go to Japan for training this winter and obtain a ski instructor certification, focusing mainly on snowboarding. Skiing has developed my communication skills and leadership abilities. I believe this experience makes me a more well-rounded professional.';
            }
        }
        // Update highlight cards
        var highlights = document.querySelectorAll('.highlight');
        if (highlights.length >= 3) {
            if (this.currentLang === 'zh') {
                highlights[0].querySelector('h4').textContent = '機器學習';
                highlights[0].querySelector('p').textContent = '專精於影像辨識與深度學習，熱愛解決複雜的技術問題';
                highlights[1].querySelector('h4').textContent = '滑雪教練';
                highlights[1].querySelector('p').textContent = '規劃前往日本受訓，準備考取滑雪教練證照';
                highlights[2].querySelector('h4').textContent = '持續學習';
                highlights[2].querySelector('p').textContent = '保持對新技術的熱忱，不斷提升專業技能';
            }
            else {
                highlights[0].querySelector('h4').textContent = 'Machine Learning';
                highlights[0].querySelector('p').textContent = 'Specialized in image recognition and deep learning, passionate about solving complex technical problems';
                highlights[1].querySelector('h4').textContent = 'Snowboard Instructor';
                highlights[1].querySelector('p').textContent = 'Planning to go to Japan for training to obtain snowboard instructor certification';
                highlights[2].querySelector('h4').textContent = 'Continuous Learning';
                highlights[2].querySelector('p').textContent = 'Maintain enthusiasm for new technologies and continuously improve professional skills';
            }
        }
        // Update timeline content
        var timelineItems = document.querySelectorAll('.timeline-content');
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
            }
            else {
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
        // Update skill categories and items
        var skillCategories = document.querySelectorAll('.skill-category');
        var skillCategoryTitles = document.querySelectorAll('.skill-category h3');
        // Update category titles
        if (skillCategoryTitles.length >= 3) {
            if (this.currentLang === 'zh') {
                skillCategoryTitles[0].textContent = '程式語言';
                skillCategoryTitles[1].textContent = '技術框架與工具';
                skillCategoryTitles[2].textContent = '軟技能';
            }
            else {
                skillCategoryTitles[0].textContent = 'Programming Languages';
                skillCategoryTitles[1].textContent = 'Technical Frameworks & Tools';
                skillCategoryTitles[2].textContent = 'Soft Skills';
            }
        }
        if (skillCategories.length >= 3) {
            // Programming Languages (first category)
            var progSkills = skillCategories[0].querySelectorAll('.skill-item span');
            if (progSkills.length >= 3) {
                if (this.currentLang === 'zh') {
                    progSkills[0].textContent = 'Python';
                    progSkills[1].textContent = 'HTML/CSS';
                    progSkills[2].textContent = 'JavaScript';
                }
                else {
                    progSkills[0].textContent = 'Python';
                    progSkills[1].textContent = 'HTML/CSS';
                    progSkills[2].textContent = 'JavaScript';
                }
            }
            // Technical Frameworks & Tools (second category)
            var techSkills = skillCategories[1].querySelectorAll('.skill-item span');
            if (techSkills.length >= 5) {
                if (this.currentLang === 'zh') {
                    techSkills[0].textContent = 'TensorFlow';
                    techSkills[1].textContent = 'Git';
                    techSkills[2].textContent = 'Object Detection';
                    techSkills[3].textContent = 'SketchUp';
                    techSkills[4].textContent = 'AutoCAD';
                }
                else {
                    techSkills[0].textContent = 'TensorFlow';
                    techSkills[1].textContent = 'Git';
                    techSkills[2].textContent = 'Object Detection';
                    techSkills[3].textContent = 'SketchUp';
                    techSkills[4].textContent = 'AutoCAD';
                }
            }
            // Soft Skills (third category)
            var softSkills = skillCategories[2].querySelectorAll('.skill-item span');
            if (softSkills.length >= 4) {
                if (this.currentLang === 'zh') {
                    softSkills[0].textContent = '團隊合作';
                    softSkills[1].textContent = '溝通能力';
                    softSkills[2].textContent = '問題解決';
                    softSkills[3].textContent = '教學指導';
                }
                else {
                    softSkills[0].textContent = 'Teamwork';
                    softSkills[1].textContent = 'Communication';
                    softSkills[2].textContent = 'Problem Solving';
                    softSkills[3].textContent = 'Teaching & Mentoring';
                }
            }
        }
        // Update page navigation items
        var pageNavItems = document.querySelectorAll('.page-nav-item');
        pageNavItems.forEach(function (item) {
            if (item.hasAttribute('data-zh') && item.hasAttribute('data-en')) {
                var text = _this.currentLang === 'zh' ?
                    item.getAttribute('data-zh') :
                    item.getAttribute('data-en');
                var span = item.querySelector('span');
                if (text && span) {
                    span.textContent = text;
                }
            }
        });
        // Update footer - use data attributes if available
        var footer = document.querySelector('.footer p');
        if (footer) {
            if (footer.hasAttribute('data-zh') && footer.hasAttribute('data-en')) {
                var text = this.currentLang === 'zh' ?
                    footer.getAttribute('data-zh') :
                    footer.getAttribute('data-en');
                if (text) {
                    footer.textContent = text;
                }
            }
            else {
                // Fallback for elements without data attributes
                footer.textContent = this.currentLang === 'zh' ?
                    '© 2025 羅筠笙. 保留所有權利.' :
                    '© 2025 Yun-Sheng Lo. All rights reserved.';
            }
        }
    };
    // Public method for initializing animations
    PersonalWebsite.prototype.initializeAnimations = function () {
        this.startTypingAnimation();
        this.setupParallax();
        this.setupCardHovers();
    };
    return PersonalWebsite;
}());
// Initialize the website when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    var website = new PersonalWebsite();
    website.initializeAnimations();
    // Add loading animation
    var loader = document.createElement('div');
    loader.className = 'loader';
    loader.style.cssText = "\n        position: fixed;\n        top: 0;\n        left: 0;\n        width: 100%;\n        height: 100%;\n        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);\n        display: flex;\n        justify-content: center;\n        align-items: center;\n        z-index: 10000;\n        transition: opacity 0.5s ease;\n    ";
    loader.innerHTML = "\n        <div style=\"color: white; font-size: 2rem; font-weight: 600;\">\n            \u7F85\u7B60\u7B19\n        </div>\n    ";
    document.body.appendChild(loader);
    // Remove loader after page loads
    window.addEventListener('load', function () {
        setTimeout(function () {
            loader.style.opacity = '0';
            setTimeout(function () {
                document.body.removeChild(loader);
            }, 500);
        }, 1000);
    });
});
// Add CSS for navbar scroll effect
var style = document.createElement('style');
style.textContent = "\n    .nav-logo a {\n        text-decoration: none;\n    }\n    \n    .nav-logo h2 {\n        color: #e2e8f0;\n        transition: all 0.3s ease;\n    }\n    \n    .navbar.scrolled {\n        background: rgba(255, 255, 255, 0.98);\n        box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);\n    }\n    \n    .navbar.scrolled .nav-logo h2 {\n        color: #1e293b;\n    }\n    \n    .navbar.scrolled .nav-link {\n        color: #1e293b;\n    }\n    \n    .navbar.scrolled .nav-link:hover {\n        color: #60a5fa;\n    }\n    \n    .navbar.scrolled .bar {\n        background-color: #1e293b;\n    }\n    \n    .navbar.scrolled .lang-btn {\n        border-color: #1e293b;\n        color: #1e293b;\n    }\n    \n    .navbar.scrolled .lang-btn:hover {\n        background: #1e293b;\n        color: white;\n    }\n    \n    .hamburger.active .bar:nth-child(2) {\n        opacity: 0;\n    }\n    \n    .hamburger.active .bar:nth-child(1) {\n        transform: translateY(8px) rotate(45deg);\n    }\n    \n    .hamburger.active .bar:nth-child(3) {\n        transform: translateY(-8px) rotate(-45deg);\n    }\n";
document.head.appendChild(style);
