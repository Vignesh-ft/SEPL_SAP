import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RotorShaftAssemblyComponent } from './rotor-shaft-assembly.component';

describe('RotorShaftAssemblyComponent', () => {
  let component: RotorShaftAssemblyComponent;
  let fixture: ComponentFixture<RotorShaftAssemblyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RotorShaftAssemblyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RotorShaftAssemblyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
