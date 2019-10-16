import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WifiPage } from './wifi.page';

describe('WifiPage', () => {
  let component: WifiPage;
  let fixture: ComponentFixture<WifiPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WifiPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WifiPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
