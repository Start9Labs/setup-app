import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { AppLogsPage } from './app-logs.page'

describe('AppLogsPage', () => {
  let component: AppLogsPage
  let fixture: ComponentFixture<AppLogsPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppLogsPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AppLogsPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
