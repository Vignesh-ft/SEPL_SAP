import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VarnishStatorAssemblyComponent } from './varnish-stator-assembly.component';

describe('VarnishStatorAssemblyComponent', () => {
  let component: VarnishStatorAssemblyComponent;
  let fixture: ComponentFixture<VarnishStatorAssemblyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VarnishStatorAssemblyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VarnishStatorAssemblyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
