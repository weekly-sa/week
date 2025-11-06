class AgeTaskTracker {
    constructor() {
        this.currentUser = null;
        this.currentView = 'day';
        this.currentDate = new Date();
        this.tasks = [];
        this.completions = [];
        this.stats = [];

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.checkAuth();
    }

    setupEventListeners() {
        // Auth
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchAuthTab(e.target.dataset.tab));
        });

        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

        // View
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.dataset.view));
        });

        // Navigation
        document.getElementById('prevBtn').addEventListener('click', () => this.previousPeriod());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextPeriod());
        document.getElementById('todayBtn').addEventListener('click', () => this.goToToday());

        // Tasks
        document.getElementById('addTaskForm').addEventListener('submit', (e) => this.handleAddTask(e));

        // Modal
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('statsModal');
            if (e.target === modal) this.closeModal();
        });
    }

    switchAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}Form`).classList.add('active');
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            this.currentUser = data.user;
            this.showMainSection();
            await this.loadUserData();
            this.renderCurrentView();
        } catch (error) {
            this.showAuthError('loginError', error.message);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const birthDate = document.getElementById('birthDate').value;

        try {
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;

            this.currentUser = data.user;

            // Save user profile
            const { error: profileError } = await supabase
                .from('users')
                .insert([{
                    id: data.user.id,
                    email,
                    password_hash: password,
                    birth_date: birthDate
                }]);

            if (profileError) throw profileError;

            this.showMainSection();
            await this.loadUserData();
            this.renderCurrentView();
        } catch (error) {
            this.showAuthError('registerError', error.message);
        }
    }

    async handleLogout() {
        await supabase.auth.signOut();
        this.currentUser = null;
        document.getElementById('authSection').classList.remove('hidden');
        document.getElementById('mainSection').classList.add('hidden');
        document.getElementById('loginForm').reset();
        document.getElementById('registerForm').reset();
    }

    showAuthError(elementId, message) {
        const errorEl = document.getElementById(elementId);
        errorEl.textContent = message;
        errorEl.classList.add('show');
        setTimeout(() => {
            errorEl.classList.remove('show');
            errorEl.textContent = '';
        }, 5000);
    }

    showMainSection() {
        document.getElementById('authSection').classList.add('hidden');
        document.getElementById('mainSection').classList.remove('hidden');
    }

    async checkAuth() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            this.currentUser = user;
            this.showMainSection();
            await this.loadUserData();
            this.renderCurrentView();
        }
    }

    async loadUserData() {
        const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', this.currentUser.id)
            .single();

        if (userData) {
            this.updateAgeDisplay(userData.birth_date);
        }

        const { data: tasksData } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', this.currentUser.id);

        this.tasks = tasksData || [];

        const { data: completionsData } = await supabase
            .from('task_completions')
            .select('*')
            .eq('user_id', this.currentUser.id);

        this.completions = completionsData || [];

        const { data: statsData } = await supabase
            .from('daily_stats')
            .select('*')
            .eq('user_id', this.currentUser.id);

        this.stats = statsData || [];
    }

    updateAgeDisplay(birthDate) {
        const birth = new Date(birthDate);
        const today = new Date();

        const diffTime = Math.abs(today - birth);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        let years = 0, months = 0;
        let tempDate = new Date(birth);

        while (tempDate < today) {
            tempDate.setFullYear(tempDate.getFullYear() + 1);
            if (tempDate <= today) years++;
            else break;
        }

        tempDate = new Date(birth);
        tempDate.setFullYear(tempDate.getFullYear() + years);

        while (tempDate < today) {
            tempDate.setMonth(tempDate.getMonth() + 1);
            if (tempDate <= today) months++;
            else break;
        }

        const weeks = Math.floor(diffDays / 7);

        document.getElementById('ageYears').textContent = years;
        document.getElementById('ageMonths').textContent = months;
        document.getElementById('ageWeeks').textContent = weeks;
        document.getElementById('ageDays').textContent = diffDays;
    }

    switchView(view) {
        this.currentView = view;
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        this.currentDate = new Date();
        this.renderCurrentView();
    }

    previousPeriod() {
        const date = new Date(this.currentDate);

        switch(this.currentView) {
            case 'day':
                date.setDate(date.getDate() - 1);
                break;
            case 'week':
                date.setDate(date.getDate() - 7);
                break;
            case 'month':
                date.setMonth(date.getMonth() - 1);
                break;
            case 'year':
                date.setFullYear(date.getFullYear() - 1);
                break;
        }

        this.currentDate = date;
        this.renderCurrentView();
    }

    nextPeriod() {
        const date = new Date(this.currentDate);

        switch(this.currentView) {
            case 'day':
                date.setDate(date.getDate() + 1);
                break;
            case 'week':
                date.setDate(date.getDate() + 7);
                break;
            case 'month':
                date.setMonth(date.getMonth() + 1);
                break;
            case 'year':
                date.setFullYear(date.getFullYear() + 1);
                break;
        }

        this.currentDate = date;
        this.renderCurrentView();
    }

    goToToday() {
        this.currentDate = new Date();
        this.renderCurrentView();
    }

    renderCurrentView() {
        const views = ['dayView', 'weekView', 'monthView', 'yearView'];
        views.forEach(view => {
            document.getElementById(view).classList.remove('active');
        });

        const viewMap = { day: 'dayView', week: 'weekView', month: 'monthView', year: 'yearView' };
        document.getElementById(viewMap[this.currentView]).classList.add('active');

        switch(this.currentView) {
            case 'day':
                this.renderDayView();
                break;
            case 'week':
                this.renderWeekView();
                break;
            case 'month':
                this.renderMonthView();
                break;
            case 'year':
                this.renderYearView();
                break;
        }
    }

    renderDayView() {
        const dateStr = this.formatDateArabic(this.currentDate);
        document.getElementById('dayTitle').textContent = dateStr;
        document.getElementById('dateDisplay').textContent = dateStr;

        const dayTasks = this.getTasksForDate(this.currentDate);
        const completed = this.getCompletedTasksForDate(this.currentDate);

        this.renderTasksList(dayTasks, completed);
        this.updateDayPerformance(dayTasks, completed);
        this.updateQuickStats(dayTasks, completed);
    }

    renderWeekView() {
        const startDate = this.getWeekStart(this.currentDate);
        const weekNumber = this.getWeekNumber(this.currentDate);
        document.getElementById('dateDisplay').textContent = `الأسبوع ${weekNumber} - ${this.formatMonthYear(this.currentDate)}`;

        const headerRow = document.getElementById('weekHeader');
        headerRow.innerHTML = '';

        const dayNames = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);

            const th = document.createElement('th');
            th.textContent = `${dayNames[i]}\n${date.getDate()}`;
            headerRow.appendChild(th);
        }

        const tbody = document.getElementById('weekBody');
        tbody.innerHTML = '';

        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);

            const td = document.createElement('td');
            const dayTasks = this.getTasksForDate(date);
            const completed = this.getCompletedTasksForDate(date);

            const performance = this.getPerformanceLevel(dayTasks.length, completed.length);
            td.className = performance;

            if (this.isToday(date)) {
                td.classList.add('today');
            }

            td.innerHTML = `
                <div class="cell-day">${date.getDate()}</div>
                <div class="cell-tasks">${completed.length}/${dayTasks.length}</div>
            `;

            tbody.appendChild(td);
        }
    }

    renderMonthView() {
        document.getElementById('dateDisplay').textContent = this.formatMonthYear(this.currentDate);

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = this.getMonthStartForCalendar(firstDay);

        const headerRow = document.getElementById('monthHeader');
        headerRow.innerHTML = '';
        const dayNames = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

        dayNames.forEach(day => {
            const th = document.createElement('th');
            th.textContent = day;
            headerRow.appendChild(th);
        });

        const tbody = document.getElementById('monthBody');
        tbody.innerHTML = '';
        let currentDate = new Date(startDate);

        for (let week = 0; week < 6; week++) {
            const tr = document.createElement('tr');

            for (let day = 0; day < 7; day++) {
                const td = document.createElement('td');

                if (currentDate.getMonth() !== month) {
                    td.style.opacity = '0.3';
                }

                const dayTasks = this.getTasksForDate(currentDate);
                const completed = this.getCompletedTasksForDate(currentDate);
                const performance = this.getPerformanceLevel(dayTasks.length, completed.length);

                td.className = performance;

                if (this.isToday(currentDate)) {
                    td.classList.add('today');
                }

                td.innerHTML = `
                    <div class="cell-day">${currentDate.getDate()}</div>
                    <div class="cell-tasks">${completed.length}/${dayTasks.length}</div>
                `;

                tr.appendChild(td);
                currentDate = new Date(currentDate);
                currentDate.setDate(currentDate.getDate() + 1);
            }

            tbody.appendChild(tr);
        }
    }

    renderYearView() {
        const year = this.currentDate.getFullYear();
        document.getElementById('dateDisplay').textContent = `السنة ${year}`;

        const yearGrid = document.getElementById('yearGrid');
        yearGrid.innerHTML = '';

        const monthNames = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];

        for (let month = 0; month < 12; month++) {
            const monthStart = new Date(year, month, 1);
            const monthEnd = new Date(year, month + 1, 0);

            let monthTotalTasks = 0;
            let monthCompletedTasks = 0;

            for (let day = 1; day <= monthEnd.getDate(); day++) {
                const date = new Date(year, month, day);
                const dayTasks = this.getTasksForDate(date);
                const completed = this.getCompletedTasksForDate(date);

                monthTotalTasks += dayTasks.length;
                monthCompletedTasks += completed.length;
            }

            const performance = this.getPerformanceLevel(monthTotalTasks, monthCompletedTasks);

            const card = document.createElement('div');
            card.className = `month-card ${performance}`;
            card.innerHTML = `
                <h3>${monthNames[month]}</h3>
                <div class="month-card-stats">
                    <div class="month-stat">
                        <span class="month-stat-label">إجمالي المهام</span>
                        <span class="month-stat-value">${monthTotalTasks}</span>
                    </div>
                    <div class="month-stat">
                        <span class="month-stat-label">المهام المكتملة</span>
                        <span class="month-stat-value">${monthCompletedTasks}</span>
                    </div>
                    <div class="month-stat">
                        <span class="month-stat-label">نسبة الإنجاز</span>
                        <span class="month-stat-value">${monthTotalTasks > 0 ? Math.round((monthCompletedTasks / monthTotalTasks) * 100) : 0}%</span>
                    </div>
                </div>
            `;

            yearGrid.appendChild(card);
        }
    }

    renderTasksList(tasks, completed) {
        const tasksList = document.getElementById('dayTasksList');
        tasksList.innerHTML = '';

        if (tasks.length === 0) {
            tasksList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">لا توجد مهام لهذا اليوم</p>';
            return;
        }

        tasks.forEach(task => {
            const isCompleted = completed.some(c => c.task_id === task.id);
            const taskEl = document.createElement('div');
            taskEl.className = `task-item ${isCompleted ? 'completed' : ''}`;

            taskEl.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${isCompleted ? 'checked' : ''} data-task-id="${task.id}">
                <div class="task-info">
                    <div class="task-title">${task.title}</div>
                    ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    <span class="task-frequency">${this.getFrequencyLabel(task.frequency)}</span>
                </div>
                <div class="task-actions">
                    <button class="btn btn-danger delete-task" data-task-id="${task.id}">حذف</button>
                </div>
            `;

            const checkbox = taskEl.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => this.toggleTaskCompletion(task.id, checkbox.checked));

            const deleteBtn = taskEl.querySelector('.delete-task');
            deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

            tasksList.appendChild(taskEl);
        });
    }

    updateDayPerformance(tasks, completed) {
        const badge = document.getElementById('dayPerformance');
        const performance = this.getPerformanceLevel(tasks.length, completed.length);
        const labels = { green: 'ممتاز', yellow: 'جيد جداً', red: 'غير منتظم', black: 'سيئ' };

        badge.className = `performance-badge ${performance}`;
        badge.textContent = labels[performance];
    }

    updateQuickStats(tasks, completed) {
        document.getElementById('totalTasks').textContent = tasks.length;
        document.getElementById('completedTasks').textContent = completed.length;
        const rate = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;
        document.getElementById('completionRate').textContent = `${rate}%`;
    }

    async handleAddTask(e) {
        e.preventDefault();
        const title = document.getElementById('taskTitle').value;
        const description = document.getElementById('taskDescription').value;
        const frequency = document.getElementById('taskFrequency').value;

        try {
            const { data, error } = await supabase.from('tasks').insert([{
                user_id: this.currentUser.id,
                title,
                description,
                frequency,
                start_date: new Date().toISOString().split('T')[0]
            }]);

            if (error) throw error;

            document.getElementById('addTaskForm').reset();
            await this.loadUserData();
            this.renderCurrentView();
        } catch (error) {
            this.showAuthError('taskError', error.message);
        }
    }

    async toggleTaskCompletion(taskId, isCompleted) {
        const today = new Date().toISOString().split('T')[0];

        try {
            if (isCompleted) {
                const { error } = await supabase.from('task_completions').insert([{
                    task_id: taskId,
                    user_id: this.currentUser.id,
                    completion_date: today
                }]);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('task_completions')
                    .delete()
                    .eq('task_id', taskId)
                    .eq('completion_date', today);
                if (error) throw error;
            }

            await this.loadUserData();
            this.renderCurrentView();
        } catch (error) {
            console.error('Error toggling task:', error);
        }
    }

    async deleteTask(taskId) {
        if (!confirm('هل أنت متأكد من حذف هذه المهمة؟')) return;

        try {
            const { error } = await supabase.from('tasks').delete().eq('id', taskId);
            if (error) throw error;

            await this.loadUserData();
            this.renderCurrentView();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }

    closeModal() {
        document.getElementById('statsModal').classList.add('hidden');
    }

    // Utility functions
    getTasksForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.tasks.filter(task => {
            const startDate = task.start_date;
            const endDate = task.end_date || dateStr;

            if (dateStr < startDate || dateStr > endDate) return false;

            switch(task.frequency) {
                case 'daily':
                    return true;
                case 'weekly':
                    const startDay = new Date(startDate).getDay();
                    return date.getDay() === startDay;
                case 'monthly':
                    const startDate_day = new Date(startDate).getDate();
                    return date.getDate() === startDate_day;
                case 'yearly':
                    const start = new Date(startDate);
                    return date.getMonth() === start.getMonth() && date.getDate() === start.getDate();
                default:
                    return false;
            }
        });
    }

    getCompletedTasksForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.completions.filter(c => c.completion_date === dateStr);
    }

    getPerformanceLevel(total, completed) {
        if (total === 0) return 'black';
        const rate = (completed / total) * 100;

        if (rate >= 80) return 'green';
        if (rate >= 50) return 'yellow';
        if (rate >= 20) return 'red';
        return 'black';
    }

    formatDateArabic(date) {
        const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }

    formatMonthYear(date) {
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    }

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    getMonthStartForCalendar(date) {
        const first = new Date(date.getFullYear(), date.getMonth(), 1);
        return new Date(first.setDate(first.getDate() - first.getDay()));
    }

    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    getFrequencyLabel(frequency) {
        const labels = {
            daily: 'يومي',
            weekly: 'أسبوعي',
            monthly: 'شهري',
            yearly: 'سنوي'
        };
        return labels[frequency] || frequency;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AgeTaskTracker();
});
