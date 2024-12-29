import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinalAssemblyComponent } from './final-assembly.component';

describe('FinalAssemblyComponent', () => {
  let component: FinalAssemblyComponent;
  let fixture: ComponentFixture<FinalAssemblyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinalAssemblyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinalAssemblyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
