import { Component } from '@angular/core';
import { ChartsTemplateComponent } from '../../../../Components/charts-template/charts-template.component';

@Component({
  selector: 'app-continuity-test-mannual',
  standalone: true,
  imports: [ChartsTemplateComponent],
  templateUrl: './continuity-test-mannual.component.html',
  styleUrl: './continuity-test-mannual.component.scss'
})
export class ContinuityTestMannualComponent {
  title:any = "CONTINUITY TEST MANNUAL"
}
