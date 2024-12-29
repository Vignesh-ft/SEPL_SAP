import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartsTemplateComponent } from './charts-template.component';

describe('ChartsTemplateComponent', () => {
  let component: ChartsTemplateComponent;
  let fixture: ComponentFixture<ChartsTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartsTemplateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChartsTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
