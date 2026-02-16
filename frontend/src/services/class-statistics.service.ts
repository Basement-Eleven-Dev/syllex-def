import { Injectable } from '@angular/core';
import { AttemptInterface } from './tests-service';
import { User } from './auth';

export interface StudentPerformanceData {
  Student: User;
  CompletedTests: number;
  PerformancePercentage: number;
}

@Injectable({
  providedIn: 'root',
})
export class ClassStatisticsService {
  /**
   * Computes the average performance percentage from a list of test attempts
   * @param attempts List of test attempts to analyze
   * @returns Average percentage score, rounded to nearest integer
   */
  computeAveragePerformance(attempts: AttemptInterface[]): number {
    if (attempts.length === 0) {
      return 0;
    }

    const validAttempts = attempts.filter((attempt) => attempt.maxScore > 0);

    if (validAttempts.length === 0) {
      return 0;
    }

    const totalPercentage = validAttempts.reduce((sum, attempt) => {
      const percentage = (attempt.score / attempt.maxScore) * 100;
      return sum + percentage;
    }, 0);

    return Math.round(totalPercentage / validAttempts.length);
  }

  /**
   * Enriches student data with their test performance metrics
   * @param students List of students to enrich
   * @param attempts All test attempts for the class
   * @returns Array of students with performance data
   */
  enrichStudentsWithPerformance(
    students: User[],
    attempts: AttemptInterface[],
  ): StudentPerformanceData[] {
    return students.map((student) => {
      const studentAttempts = attempts.filter(
        (attempt) => attempt.studentId === student._id,
      );

      return {
        Student: student,
        CompletedTests: studentAttempts.length,
        PerformancePercentage: this.computeAveragePerformance(studentAttempts),
      };
    });
  }
}
