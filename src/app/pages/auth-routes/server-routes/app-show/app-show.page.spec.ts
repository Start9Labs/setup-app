import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppShowPage } from './app-show.page';

describe('AppShowPage', () => {
  let component: AppShowPage;
  let fixture: ComponentFixture<AppShowPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppShowPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppShowPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
