import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpTestMannualComponent } from './sp-test-mannual.component';

describe('SpTestMannualComponent', () => {
  let component: SpTestMannualComponent;
  let fixture: ComponentFixture<SpTestMannualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpTestMannualComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpTestMannualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
