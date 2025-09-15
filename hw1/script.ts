// TypeScript for Personal Website

// Interface definitions
interface SkillProgress {
    element: HTMLElement;
    width: string;
}

interface ContactFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
}

interface LanguageContent {
    zh: string;
    en: string;
}

class PersonalWebsite {
    private navMenu: HTMLElement | null;
    private hamburger: HTMLElement | null;
    private skillBars: NodeListOf<HTMLElement>;
    private contactForm: HTMLFormElement | null;
    private langToggle: HTMLElement | null;
    private currentLang: 'zh' | 'en';
    private observer!: IntersectionObserver;

    constructor() {
        this.navMenu = document.querySelector('.nav-menu');
        this.hamburger = document.querySelector('.hamburger');
        this.skillBars = document.querySelectorAll('.skill-progress');
        this.contactForm = document.getElementById('contactForm') as HTMLFormElement;
        this.langToggle = document.getElementById('langToggle');
        this.currentLang = 'zh'; // Default language
        
        this.init();
    }

    private init(): void {
        this.setupNavigation();
        this.setupScrollAnimations();
        this.setupSkillBars();
        this.setupContactForm();
        this.setupSmoothScrolling();
        this.setupNavbarScroll();
        this.setupLanguageToggle();
        this.setupBackToTop();
        this.setupPageNavigation();
    }

    // Navigation functionality
    private setupNavigation(): void {
        if (this.hamburger && this.navMenu) {
            this.hamburger.addEventListener('click', () => {
                this.hamburger?.classList.toggle('active');
                this.navMenu?.classList.toggle('active');
                
                // Add language switcher to mobile menu when active
                if (this.navMenu?.classList.contains('active')) {
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
                    this.hamburger?.classList.remove('active');
                    this.navMenu?.classList.remove('active');
                });
            });
        }
    }

    // Smooth scrolling for navigation links
    private setupSmoothScrolling(): void {
        const navLinks = document.querySelectorAll('a[href^="#"]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                if (targetId) {
                    const targetElement = document.querySelector(targetId) as HTMLElement;
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
    private setupNavbarScroll(): void {
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
    private setupScrollAnimations(): void {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Special handling for skill bars
                    if (entry.target.classList.contains('skill-progress')) {
                        this.animateSkillBar(entry.target as HTMLElement);
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
    private setupSkillBars(): void {
        this.skillBars.forEach(bar => {
            const width = bar.getAttribute('data-width');
            if (width) {
                bar.style.width = '0%';
            }
        });
    }

    private animateSkillBar(element: HTMLElement): void {
        const width = element.getAttribute('data-width');
        if (width) {
            setTimeout(() => {
                element.style.width = width + '%';
            }, 200);
        }
    }

    // Contact form handling
    private setupContactForm(): void {
        if (this.contactForm) {
            this.contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmission();
            });
        }
    }

    private handleFormSubmission(): void {
        if (!this.contactForm) return;

        const formData = new FormData(this.contactForm);
        const contactData: ContactFormData = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            subject: formData.get('subject') as string,
            message: formData.get('message') as string
        };

        // Validate form data
        if (this.validateForm(contactData)) {
            this.submitForm(contactData);
        }
    }

    private validateForm(data: ContactFormData): boolean {
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

    private submitForm(data: ContactFormData): void {
        // Simulate form submission
        this.showMessage('訊息發送中...', 'info');
        
        setTimeout(() => {
            // In a real application, you would send the data to a server
            console.log('Form submitted:', data);
            this.showMessage('訊息已成功發送！我會盡快回覆您。', 'success');
            this.contactForm?.reset();
        }, 1500);
    }

    private showMessage(message: string, type: 'success' | 'error' | 'info'): void {
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
    private startTypingAnimation(): void {
        const nameElement = document.querySelector('.hero .name');
        if (nameElement) {
            const text = nameElement.textContent || '';
            nameElement.textContent = '';
            
            let i = 0;
            const typeWriter = (): void => {
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
    private setupParallax(): void {
        const hero = document.querySelector('.hero') as HTMLElement;
        if (hero) {
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                const rate = scrolled * -0.5;
                hero.style.transform = `translateY(${rate}px)`;
            });
        }
    }

    // Add hover effects to cards
    private setupCardHovers(): void {
        const cards = document.querySelectorAll('.highlight, .timeline-content, .skill-items, .contact-form');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                (card as HTMLElement).style.transform = 'translateY(-5px)';
                (card as HTMLElement).style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
            });
            
            card.addEventListener('mouseleave', () => {
                (card as HTMLElement).style.transform = 'translateY(0)';
                (card as HTMLElement).style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
            });
        });
    }

    // Language toggle functionality
    private setupLanguageToggle(): void {
        if (this.langToggle) {
            this.langToggle.addEventListener('click', () => {
                this.toggleLanguage();
            });
        }
    }

    private setupBackToTop(): void {
        const backToTopBtn = document.getElementById('backToTop');
        if (!backToTopBtn) return;
        
        // Show/hide button based on scroll position
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });
        
        // Scroll to top when clicked
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    private setupPageNavigation(): void {
        const pageNav = document.getElementById('pageNav');
        if (!pageNav) return;
        
        const navToggle = pageNav.querySelector('.page-nav-toggle');
        const navMenu = pageNav.querySelector('.page-nav-menu');
        
        if (!navToggle || !navMenu) return;
        
        // Toggle navigation menu
        navToggle.addEventListener('click', () => {
            pageNav.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!pageNav.contains(e.target as Node)) {
                pageNav.classList.remove('active');
            }
        });
        
        // Close menu when clicking on nav items
        const navItems = navMenu.querySelectorAll('.page-nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                pageNav.classList.remove('active');
            });
        });
        
        // Update active nav item based on scroll position
        window.addEventListener('scroll', () => {
            const sections = document.querySelectorAll('section[id]') as NodeListOf<HTMLElement>;
            const scrollPos = window.pageYOffset + 100;
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');
                
                if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                    navItems.forEach(item => {
                        item.classList.remove('active');
                        if (item.getAttribute('href') === `#${sectionId}`) {
                            item.classList.add('active');
                        }
                    });
                }
            });
        });
    }

    private toggleLanguage(): void {
        this.currentLang = this.currentLang === 'zh' ? 'en' : 'zh';
        this.updateLanguage();
        if (this.langToggle) {
            this.langToggle.textContent = this.currentLang === 'zh' ? 'EN' : '中';
        }
        
        // Force update nav logo after a short delay to ensure it's not overridden
        setTimeout(() => {
            const navLogo = document.querySelector('.nav-logo h2');
            if (navLogo && navLogo.hasAttribute('data-zh') && navLogo.hasAttribute('data-en')) {
                const text = this.currentLang === 'zh' ? 
                    navLogo.getAttribute('data-zh') : 
                    navLogo.getAttribute('data-en');
                if (text) {
                    navLogo.textContent = text;
                    console.log('Nav logo force updated to:', text);
                }
            }
        }, 100);
    }

    private updateLanguage(): void {
        const elements = document.querySelectorAll('[data-zh][data-en]');
        elements.forEach(element => {
            const text = this.currentLang === 'zh' ? 
                element.getAttribute('data-zh') : 
                element.getAttribute('data-en');
            if (text) {
                element.textContent = text;
            }
        });
        
        // Update specific content that needs special handling
        this.updateSpecialContent();
        
        // Ensure nav logo is updated (in case it was missed)
        const navLogo = document.querySelector('.nav-logo h2');
        if (navLogo && navLogo.hasAttribute('data-zh') && navLogo.hasAttribute('data-en')) {
            const text = this.currentLang === 'zh' ? 
                navLogo.getAttribute('data-zh') : 
                navLogo.getAttribute('data-en');
            if (text) {
                navLogo.textContent = text;
                console.log('Nav logo updated to:', text); // Debug log
            }
        }
    }

    private updateSpecialContent(): void {
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
                (highlights[0].querySelector('h4') as HTMLElement).textContent = '機器學習';
                (highlights[0].querySelector('p') as HTMLElement).textContent = '專精於影像辨識與深度學習，熱愛解決複雜的技術問題';
                (highlights[1].querySelector('h4') as HTMLElement).textContent = '滑雪教練';
                (highlights[1].querySelector('p') as HTMLElement).textContent = '規劃前往日本受訓，準備考取滑雪教練證照';
                (highlights[2].querySelector('h4') as HTMLElement).textContent = '持續學習';
                (highlights[2].querySelector('p') as HTMLElement).textContent = '保持對新技術的熱忱，不斷提升專業技能';
            } else {
                (highlights[0].querySelector('h4') as HTMLElement).textContent = 'Machine Learning';
                (highlights[0].querySelector('p') as HTMLElement).textContent = 'Specialized in image recognition and deep learning, passionate about solving complex technical problems';
                (highlights[1].querySelector('h4') as HTMLElement).textContent = 'Snowboard Instructor';
                (highlights[1].querySelector('p') as HTMLElement).textContent = 'Planning to go to Japan for training to obtain snowboard instructor certification';
                (highlights[2].querySelector('h4') as HTMLElement).textContent = 'Continuous Learning';
                (highlights[2].querySelector('p') as HTMLElement).textContent = 'Maintain enthusiasm for new technologies and continuously improve professional skills';
            }
        }

        // Update timeline content
        const timelineItems = document.querySelectorAll('.timeline-content');
        if (timelineItems.length >= 3) {
            if (this.currentLang === 'zh') {
                (timelineItems[0].querySelector('h3') as HTMLElement).textContent = '滑雪教練';
                (timelineItems[0].querySelector('.timeline-description') as HTMLElement).textContent = '冬季期間擔任滑雪教練，教授初學者滑雪技巧。培養了良好的溝通能力、耐心和領導技巧，這些技能也應用在團隊合作和專案管理中。';
                (timelineItems[1].querySelector('h3') as HTMLElement).textContent = '國立臺灣大學';
                (timelineItems[1].querySelector('h4') as HTMLElement).textContent = '工程科學及海洋工程學系暨研究所';
                (timelineItems[1].querySelector('.timeline-description') as HTMLElement).textContent = '就讀國立臺灣大學工程科學及海洋工程學系暨研究所，目前碩士二年級，專精於程式設計、資料結構、演算法、系統設計等核心課程。積極參與專案開發，累積實務經驗。';
                (timelineItems[2].querySelector('h3') as HTMLElement).textContent = '國立成功大學';
                (timelineItems[2].querySelector('h4') as HTMLElement).textContent = '水利及海洋工程學系學系輔工程科學系';
                (timelineItems[2].querySelector('.timeline-description') as HTMLElement).textContent = '在大學期間內除了本系上的課程外，因為對於程式設計有著濃厚的興趣所以選擇工程科學系作為輔系。在輔系期間內修習了許多程式設計相關的課程，包含程式設計、資料結構、作業系統等資工領域相關課程，在現階段奠定了不錯的程式基礎。';
            } else {
                (timelineItems[0].querySelector('h3') as HTMLElement).textContent = 'Snowboard Instructor';
                (timelineItems[0].querySelector('.timeline-description') as HTMLElement).textContent = 'Work as a snowboard instructor during winter, teaching skiing techniques to beginners. Developed excellent communication skills, patience and leadership skills, which are also applied in teamwork and project management.';
                (timelineItems[1].querySelector('h3') as HTMLElement).textContent = 'National Taiwan University';
                (timelineItems[1].querySelector('h4') as HTMLElement).textContent = 'Department and Graduate Institute of Engineering Science and Ocean Engineering';
                (timelineItems[1].querySelector('.timeline-description') as HTMLElement).textContent = 'Studying in the Department and Graduate Institute of Engineering Science and Ocean Engineering at National Taiwan University, currently in second year of master\'s program, specializing in programming, data structures, algorithms, system design and other core courses. Actively participating in project development and accumulating practical experience.';
                (timelineItems[2].querySelector('h3') as HTMLElement).textContent = 'National Cheng Kung University';
                (timelineItems[2].querySelector('h4') as HTMLElement).textContent = 'Department of Hydraulic and Ocean Engineering, Minor in Engineering Science';
                (timelineItems[2].querySelector('.timeline-description') as HTMLElement).textContent = 'During university, in addition to courses in my major, I chose Engineering Science as a minor due to my strong interest in programming. During the minor program, I studied many programming-related courses, including programming, data structures, operating systems and other computer science courses, establishing a solid programming foundation.';
            }
        }

        // Update skill categories and items
        const skillCategories = document.querySelectorAll('.skill-category');
        const skillCategoryTitles = document.querySelectorAll('.skill-category h3');
        
        // Update category titles
        if (skillCategoryTitles.length >= 3) {
            if (this.currentLang === 'zh') {
                (skillCategoryTitles[0] as HTMLElement).textContent = '程式語言';
                (skillCategoryTitles[1] as HTMLElement).textContent = '技術框架與工具';
                (skillCategoryTitles[2] as HTMLElement).textContent = '軟技能';
            } else {
                (skillCategoryTitles[0] as HTMLElement).textContent = 'Programming Languages';
                (skillCategoryTitles[1] as HTMLElement).textContent = 'Technical Frameworks & Tools';
                (skillCategoryTitles[2] as HTMLElement).textContent = 'Soft Skills';
            }
        }
        
        if (skillCategories.length >= 3) {
            // Programming Languages (first category)
            const progSkills = skillCategories[0].querySelectorAll('.skill-item span');
            if (progSkills.length >= 3) {
                if (this.currentLang === 'zh') {
                    (progSkills[0] as HTMLElement).textContent = 'Python';
                    (progSkills[1] as HTMLElement).textContent = 'HTML/CSS';
                    (progSkills[2] as HTMLElement).textContent = 'JavaScript';
                } else {
                    (progSkills[0] as HTMLElement).textContent = 'Python';
                    (progSkills[1] as HTMLElement).textContent = 'HTML/CSS';
                    (progSkills[2] as HTMLElement).textContent = 'JavaScript';
                }
            }
            
            // Technical Frameworks & Tools (second category)
            const techSkills = skillCategories[1].querySelectorAll('.skill-item span');
            if (techSkills.length >= 5) {
                if (this.currentLang === 'zh') {
                    (techSkills[0] as HTMLElement).textContent = 'TensorFlow';
                    (techSkills[1] as HTMLElement).textContent = 'Git';
                    (techSkills[2] as HTMLElement).textContent = 'Object Detection';
                    (techSkills[3] as HTMLElement).textContent = 'SketchUp';
                    (techSkills[4] as HTMLElement).textContent = 'AutoCAD';
                } else {
                    (techSkills[0] as HTMLElement).textContent = 'TensorFlow';
                    (techSkills[1] as HTMLElement).textContent = 'Git';
                    (techSkills[2] as HTMLElement).textContent = 'Object Detection';
                    (techSkills[3] as HTMLElement).textContent = 'SketchUp';
                    (techSkills[4] as HTMLElement).textContent = 'AutoCAD';
                }
            }
            
            // Soft Skills (third category)
            const softSkills = skillCategories[2].querySelectorAll('.skill-item span');
            if (softSkills.length >= 4) {
                if (this.currentLang === 'zh') {
                    (softSkills[0] as HTMLElement).textContent = '團隊合作';
                    (softSkills[1] as HTMLElement).textContent = '溝通能力';
                    (softSkills[2] as HTMLElement).textContent = '問題解決';
                    (softSkills[3] as HTMLElement).textContent = '教學指導';
                } else {
                    (softSkills[0] as HTMLElement).textContent = 'Teamwork';
                    (softSkills[1] as HTMLElement).textContent = 'Communication';
                    (softSkills[2] as HTMLElement).textContent = 'Problem Solving';
                    (softSkills[3] as HTMLElement).textContent = 'Teaching & Mentoring';
                }
            }
        }

        // Update page navigation items
        const pageNavItems = document.querySelectorAll('.page-nav-item');
        pageNavItems.forEach(item => {
            if (item.hasAttribute('data-zh') && item.hasAttribute('data-en')) {
                const text = this.currentLang === 'zh' ? 
                    item.getAttribute('data-zh') : 
                    item.getAttribute('data-en');
                const span = item.querySelector('span');
                if (text && span) {
                    span.textContent = text;
                }
            }
        });

        // Update footer - use data attributes if available
        const footer = document.querySelector('.footer p');
        if (footer) {
            if (footer.hasAttribute('data-zh') && footer.hasAttribute('data-en')) {
                const text = this.currentLang === 'zh' ? 
                    footer.getAttribute('data-zh') : 
                    footer.getAttribute('data-en');
                if (text) {
                    footer.textContent = text;
                }
            } else {
                // Fallback for elements without data attributes
                footer.textContent = this.currentLang === 'zh' ? 
                    '© 2025 羅筠笙. 保留所有權利.' : 
                    '© 2025 Yun-Sheng Lo. All rights reserved.';
            }
        }
    }

    // Public method for initializing animations
    public initializeAnimations(): void {
        this.startTypingAnimation();
        this.setupParallax();
        this.setupCardHovers();
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
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        transition: opacity 0.5s ease;
    `;
    
    loader.innerHTML = `
        <div style="color: white; font-size: 2rem; font-weight: 600;">
            羅筠笙
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
    .nav-logo a {
        text-decoration: none;
    }
    
    .nav-logo h2 {
        color: #e2e8f0;
        transition: all 0.3s ease;
    }
    
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