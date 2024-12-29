import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContinuityTestMannualComponent } from './continuity-test-mannual.component';

describe('ContinuityTestMannualComponent', () => {
  let component: ContinuityTestMannualComponent;
  let fixture: ComponentFixture<ContinuityTestMannualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContinuityTestMannualComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContinuityTestMannualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
