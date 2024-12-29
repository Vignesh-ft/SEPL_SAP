import { ChartsTemplateComponent } from './../../../../Components/charts-template/charts-template.component';
import { Component } from '@angular/core';

@Component({
  selector: 'app-sp-test-mannual',
  standalone: true,
  imports: [ChartsTemplateComponent],
  templateUrl: './sp-test-mannual.component.html',
  styleUrl: './sp-test-mannual.component.scss'
})
export class SpTestMannualComponent {
  title:any = "SP TEST MANNUAL"
}
