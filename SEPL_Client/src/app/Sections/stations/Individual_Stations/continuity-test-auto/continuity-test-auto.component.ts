import { Component } from '@angular/core';
import { ChartsTemplateComponent } from '../../../../Components/charts-template/charts-template.component';

@Component({
  selector: 'app-continuity-test-auto',
  standalone: true,
  imports: [ChartsTemplateComponent],
  templateUrl: './continuity-test-auto.component.html',
  styleUrl: './continuity-test-auto.component.scss'
})
export class ContinuityTestAutoComponent {
  title:any = "CONTINUITY TEST AUTO"
}
