import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskHistoryPage } from './task-history.page';

describe('TaskHistoryPage', () => {
  let component: TaskHistoryPage;
  let fixture: ComponentFixture<TaskHistoryPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskHistoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
