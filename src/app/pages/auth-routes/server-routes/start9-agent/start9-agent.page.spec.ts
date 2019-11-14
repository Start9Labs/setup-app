import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { Start9AgentPage } from './start9-agent.page'

describe('Start9AgentPage', () => {
  let component: Start9AgentPage
  let fixture: ComponentFixture<Start9AgentPage>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Start9AgentPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(Start9AgentPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
