import { Component } from '@angular/core';
import { ChartsTemplateComponent } from '../../../../Components/charts-template/charts-template.component';

@Component({
  selector: 'app-final-assembly',
  standalone: true,
  imports: [ChartsTemplateComponent],
  templateUrl: './final-assembly.component.html',
  styleUrl: './final-assembly.component.scss'
})
export class FinalAssemblyComponent {
  title:any = "FINAL ASSEMBLY"
}
