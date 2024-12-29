import { Component } from '@angular/core';
import { ChartsTemplateComponent } from '../../../../Components/charts-template/charts-template.component';

@Component({
  selector: 'app-sp-test-auto',
  standalone: true,
  imports: [ChartsTemplateComponent],
  templateUrl: './sp-test-auto.component.html',
  styleUrl: './sp-test-auto.component.scss'
})
export class SpTestAutoComponent {
  title:any = "SP TEST AUTO"
}
