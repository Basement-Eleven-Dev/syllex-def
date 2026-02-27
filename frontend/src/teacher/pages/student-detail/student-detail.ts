import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { StudentInfoComponent } from "../../components/student-info/student-info";
import { StudentPerformanceChartComponent } from "../../components/student-performance-chart/student-performance-chart";
import { StudentAttemptsTableComponent } from "../../components/student-attempts-table/student-attempts-table";
import { StudentAiSummaryComponent } from "../../components/student-ai-summary/student-ai-summary";
import { BackTo } from "../../components/back-to/back-to";
import { StudentsService } from "../../../services/students-service";
import { faChartLine, faCheckCircle, faClock, faGraduationCap, faHistory, faLightbulb, faUser } from "@fortawesome/pro-solid-svg-icons";


interface StudentDetailsData {
  student: any;
  stats: {
    avgScore: number;
    completedTests: number;
    totalTests: number;
  };
  attempts: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  performanceByTest: any[];
  performanceByTopic: any[];
}

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [
    CommonModule, 
    FontAwesomeModule, 
    RouterModule,
    StudentInfoComponent,
    StudentPerformanceChartComponent,
    StudentAttemptsTableComponent,
    StudentAiSummaryComponent,
    BackTo
  ],
  templateUrl: './student-detail.html',
  styleUrl: './student-detail.scss'
})
export class StudentDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private studentsService = inject(StudentsService);

  studentId = signal<string | null>(null);
  classId = signal<string | null>(null);
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  studentData = signal<StudentDetailsData | null>(null);
  loading = signal<boolean>(true);

  icons = {
    faUser,
    faChartLine,
    faHistory,
    faLightbulb,
    faGraduationCap,
    faClock,
    faCheckCircle
  };

  ngOnInit() {
    this.studentId.set(this.route.snapshot.paramMap.get('studentId'));
    this.classId.set(this.route.snapshot.paramMap.get('classeId'));
    this.loadData();
  }

  loadData() {
    if (!this.studentId()) return;
    
    this.loading.set(true);
    this.studentsService.getStudentDetails(
      this.studentId()!, 
      this.classId() || undefined,
      this.currentPage(),
      this.pageSize()
    ).subscribe({
      next: (data: any) => {
        this.studentData.set(data as StudentDetailsData);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadData();
  }
}
