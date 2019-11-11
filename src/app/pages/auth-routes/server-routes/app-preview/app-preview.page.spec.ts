import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { AppPreviewPage } from './app-preview.page'

describe('AppPreviewPage', () => {
  let component: AppPreviewPage
  let fixture: ComponentFixture<AppPreviewPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppPreviewPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(AppPreviewPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
