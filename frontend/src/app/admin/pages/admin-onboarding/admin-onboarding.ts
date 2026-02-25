import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faLandmark, 
  faUserTie, 
  faBook, 
  faUsers, 
  faCheck, 
  faChevronRight, 
  faChevronLeft,
  faCloudArrowUp,
  faClipboardList,
  faUserPlus,
  faTrashCan,
  faCopy,
  faPlus,
  faFileImport,
  faUserGroup,
  faFileCsv
} from '@fortawesome/pro-solid-svg-icons';
import { FeedbackService } from '../../../../services/feedback-service';

import { OnboardingService } from '../../service/onboarding-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './admin-onboarding.html',
  styleUrl: './admin-onboarding.scss',
})
export class AdminOnboarding {
  currentStep = 1;
  totalSteps = 4;

  // Step 1: Organization
  orgData = {
    _id: 'org_mock_123', // Mock ID for demonstration
    name: '',
    logoUrl: ''
  };

  // Step 2: Staff
  staffList: any[] = [];
  newStaff = {
    firstName: '',
    lastName: '',
    email: '',
    role: 'teacher' as 'teacher' | 'admin',
    cognitoId: '' 
  };

  // Step 3: Didactic
  subjectsList: any[] = [];
  newSubject = {
    name: '',
    teacherId: ''
  };

  classesList: any[] = [];
  newClass = {
    name: '',
    year: new Date().getFullYear().toString()
  };

  studentImportMode: 'manual' | 'bulk' = 'bulk';
  bulkJsonInput = '';
  selectedClassId = '';

  // Step 4: Assignments
  assignmentsList: any[] = [];
  newAssignment = {
    teacherId: '',
    subjectId: '',
    classId: ''
  };

  // Step 5: Session Logs
  onboardingLogs: any[] = [];
  showLogs = false;

  private feedbackService = inject(FeedbackService);
  private onboardingService = inject(OnboardingService);
  private router = inject(Router);
  icons = {
    faLandmark,
    faUserTie,
    faBook,
    faUsers,
    faCheck,
    faChevronRight,
    faChevronLeft,
    faCloudArrowUp,
    faClipboardList,
    faUserPlus,
    faTrashCan,
    faCopy,
    faPlus,
    faFileImport,
    faUserGroup,
    faFileCsv
  };

  steps = [
    { id: 1, label: 'Organizzazione', icon: faLandmark },
    { id: 2, label: 'Staff', icon: faUserTie },
    { id: 3, label: 'Didattica', icon: faBook },
    { id: 4, label: 'Assegnazioni', icon: faUsers }
  ];

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number) {
    if (step < this.currentStep) {
      this.currentStep = step;
    }
  }

  addStaffMember() {
    if (!this.newStaff.firstName || !this.newStaff.lastName || !this.newStaff.email) {
      this.feedbackService.showFeedback('Compila tutti i campi obbligatori', false);
      return;
    }

    const member = {
      ...this.newStaff,
      _id: 'user_' + Math.random().toString(36).substr(2, 9),
      cognitoId: 'cog_' + Math.random().toString(36).substr(2, 9)
    };

    this.staffList.push(member);
    this.addLog('Staff', `${member.firstName} ${member.lastName}`, member._id);
    this.newStaff = { firstName: '', lastName: '', email: '', role: 'teacher', cognitoId: '' };
    this.feedbackService.showFeedback('Membro dello staff aggiunto', true);
  }

  removeStaffMember(index: number) {
    this.staffList.splice(index, 1);
    this.feedbackService.showFeedback('Membro rimosso', true);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    this.feedbackService.showFeedback('ID copiato negli appunti', true);
  }

  // Step 3 Methods
  addSubject() {
    if (!this.newSubject.name || !this.newSubject.teacherId) {
      this.feedbackService.showFeedback('Nome materia e docente sono obbligatori', false);
      return;
    }
    const subject = {
      ...this.newSubject,
      _id: 'sub_' + Math.random().toString(36).substr(2, 9)
    };
    this.subjectsList.push(subject);
    this.addLog('Materia', subject.name, subject._id);
    this.newSubject = { name: '', teacherId: '' };
    this.feedbackService.showFeedback('Materia aggiunta', true);
  }

  removeSubject(index: number) {
    this.subjectsList.splice(index, 1);
    this.feedbackService.showFeedback('Materia rimossa', true);
  }

  addClass() {
    if (!this.newClass.name) {
      this.feedbackService.showFeedback('Nome classe obbligatorio', false);
      return;
    }
    const classItem = {
      ...this.newClass,
      _id: 'cls_' + Math.random().toString(36).substr(2, 9),
      students: [] // Placeholder for students array
    };
    this.classesList.push(classItem);
    this.addLog('Classe', classItem.name, classItem._id);
    this.newClass = { name: '', year: new Date().getFullYear().toString() };
    this.feedbackService.showFeedback('Classe aggiunta', true);
  }

  removeClass(index: number) {
    this.classesList.splice(index, 1);
    this.feedbackService.showFeedback('Classe rimossa', true);
  }

  handleBulkImport() {
    if (!this.selectedClassId) {
      this.feedbackService.showFeedback('Seleziona prima una classe a cui aggiungere gli studenti', false);
      return;
    }

    try {
      const data = JSON.parse(this.bulkJsonInput);
      if (!Array.isArray(data)) throw new Error();
      
      const targetClass = this.classesList.find(c => c._id === this.selectedClassId);
      if (!targetClass) return;

      data.forEach(student => {
        const studentObj = {
          ...student,
          _id: 'std_' + Math.random().toString(36).substr(2, 9),
          status: 'Email Pending'
        };
        targetClass.students.push(studentObj);
        this.addLog('Studente (Bulk)', `${student.firstName} ${student.lastName} -> ${targetClass.name}`, studentObj._id);
      });

      this.feedbackService.showFeedback(`Preparati ${data.length} studenti per la classe ${targetClass.name}. Le credenziali verranno inviate via email da AWS Cognito al salvataggio finale.`, true);
      this.bulkJsonInput = '';
    } catch (e) {
      this.feedbackService.showFeedback('JSON non valido. Assicurati che sia un array di oggetti.', false);
    }
  }

  getTeacherName(teacherId: string): string {
    const teacher = this.staffList.find(s => s._id === teacherId);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Docente non trovato';
  }

  // Step 4 Methods
  addAssignment() {
    if (!this.newAssignment.subjectId || !this.newAssignment.classId) {
      this.feedbackService.showFeedback('Seleziona materia e classe', false);
      return;
    }

    const subject = this.subjectsList.find(s => s._id === this.newAssignment.subjectId);
    if (!subject) return;

    const assignment = {
      _id: 'asg_' + Math.random().toString(36).substr(2, 9),
      subjectId: this.newAssignment.subjectId,
      classId: this.newAssignment.classId,
      teacherId: subject.teacherId // Auto-resolve teacher from subject
    };

    this.assignmentsList.push(assignment);
    this.addLog('Assegnazione', `${this.getTeacherName(assignment.teacherId)} -> ${this.getSubjectName(assignment.subjectId)}`, assignment._id);
    this.newAssignment = { teacherId: '', subjectId: '', classId: '' };
    this.feedbackService.showFeedback('Assegnazione creata con successo', true);
  }

  removeAssignment(index: number) {
    this.assignmentsList.splice(index, 1);
    this.feedbackService.showFeedback('Assegnazione rimossa', true);
  }

  getSubjectName(subjectId: string): string {
    return this.subjectsList.find(s => s._id === subjectId)?.name || 'Materia non trovata';
  }

  getClassName(classId: string): string {
    return this.classesList.find(c => c._id === classId)?.name || 'Classe non trovata';
  }

  finishOnboarding() {
    this.feedbackService.showFeedback('Salvataggio dati in corso...', true);
    
    const payload = {
      orgData: this.orgData,
      staffList: this.staffList,
      subjectsList: this.subjectsList,
      classesList: this.classesList,
      assignmentsList: this.assignmentsList
    };

    this.onboardingService.submitOnboarding(payload).subscribe({
      next: (res) => {
        this.feedbackService.showFeedback('Onboarding completato con successo!', true);
        this.addLog('System', 'Onboarding finalizzato sul server', res.organizationId);
        // Redirect a dashboard dopo un piccolo delay
        setTimeout(() => {
          this.router.navigate(['/a/dashboard']);
        }, 2000);
      },
      error: (err) => {
        console.error('Onboarding failed:', err);
        this.feedbackService.showFeedback('Errore durante il salvataggio: ' + (err.error?.message || 'Errore sconosciuto'), false);
        this.addLog('System', 'Errore salvataggio server', 'N/A');
      }
    });
  }

  onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Per simularlo ora, creiamo un URL locale dell'immagine
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.orgData.logoUrl = e.target.result;
        this.addLog('System', 'Logo caricato localmente', 'N/A');
        this.feedbackService.showFeedback('Logo caricato', true);
      };
      reader.readAsDataURL(file);
    }
  }

  addLog(type: string, description: string, id: string) {
    this.onboardingLogs.unshift({
      timestamp: new Date().toLocaleTimeString(),
      type,
      description,
      id
    });
    // Keep only last 20 logs
    if (this.onboardingLogs.length > 20) {
      this.onboardingLogs.pop();
    }
  }

  toggleLogs() {
    this.showLogs = !this.showLogs;
  }

  downloadCredentialsReport() {
    // Generate a simple CSV for the report
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Tipo,Nome,Cognome,Email,Status\n";

    // Add Staff
    this.staffList.forEach(s => {
      csvContent += `Staff,${s.firstName},${s.lastName},${s.email},Cognito Email Flow\n`;
    });

    // Simulated students (in a real app we'd track the imported students list)
    // For now we use the logs to reconstruct what was added this session
    this.onboardingLogs.forEach(log => {
      if (log.type.includes('Studente') || log.type.includes('Staff')) {
        csvContent += `${log.type},${log.description},-,${log.id},Pending\n`;
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `syllex_onboarding_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    this.feedbackService.showFeedback('Report CSV generato e scaricato', true);
  }
}
