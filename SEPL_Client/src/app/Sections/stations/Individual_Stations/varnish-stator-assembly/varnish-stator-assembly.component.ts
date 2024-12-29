import { Component } from '@angular/core';
import { ChartsTemplateComponent } from '../../../../Components/charts-template/charts-template.component';

@Component({
  selector: 'app-varnish-stator-assembly',
  standalone: true,
  imports: [ChartsTemplateComponent],
  templateUrl: './varnish-stator-assembly.component.html',
  styleUrl: './varnish-stator-assembly.component.scss'
})
export class VarnishStatorAssemblyComponent {
  title:any = "VARNISH STATOR ASSEMBLY"
}
