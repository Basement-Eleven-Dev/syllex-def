import { Component } from '@angular/core';
import { AdminLevelStats } from "../../components/admin-level-stats/admin-level-stats";

@Component({
  selector: 'app-admin-stats',
  imports: [AdminLevelStats],
  templateUrl: './admin-stats.html',
  styleUrl: './admin-stats.scss',
})
export class AdminStats {

}
