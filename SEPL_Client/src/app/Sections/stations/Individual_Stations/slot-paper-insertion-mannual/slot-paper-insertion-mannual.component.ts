import { Component } from '@angular/core';
import { ChartsTemplateComponent } from '../../../../Components/charts-template/charts-template.component';

@Component({
  selector: 'app-slot-paper-insertion-mannual',
  standalone: true,
  imports: [ChartsTemplateComponent],
  templateUrl: './slot-paper-insertion-mannual.component.html',
  styleUrl: './slot-paper-insertion-mannual.component.scss'
})
export class SlotPaperInsertionMannualComponent {
  title:any = "SLOT PAPER INSERTION MANNUAL"
}
