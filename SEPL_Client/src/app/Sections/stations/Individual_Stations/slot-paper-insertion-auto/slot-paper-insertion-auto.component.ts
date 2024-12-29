import { Component } from '@angular/core';
import { ChartsTemplateComponent } from '../../../../Components/charts-template/charts-template.component';

@Component({
  selector: 'app-slot-paper-insertion-auto',
  standalone: true,
  imports: [ChartsTemplateComponent ],
  templateUrl: './slot-paper-insertion-auto.component.html',
  styleUrl: './slot-paper-insertion-auto.component.scss'
})
export class SlotPaperInsertionAutoComponent {
  title:any = "SLOT PAPER INSERTION AUTO"
}
