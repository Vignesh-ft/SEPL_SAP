import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpTestAutoComponent } from './sp-test-auto.component';

describe('SpTestAutoComponent', () => {
  let component: SpTestAutoComponent;
  let fixture: ComponentFixture<SpTestAutoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpTestAutoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpTestAutoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
