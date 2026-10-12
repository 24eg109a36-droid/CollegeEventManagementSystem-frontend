import { useEffect, useState } from 'react'
import api from './api'

const blankEvent = {
  title: '', description: '', venue: '', eventDate: '', eventTime: '',
  organizer: '', capacity: 100
}
const blankRegistration = { studentName: '', email: '', studentId: '' }

function readableError(error) {
  const data = error?.response?.data
  if (typeof data === 'string') return data
  return data?.detail || data?.message || data?.title || error.message || 'Something went wrong.'
}

export default function App() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState(null)
  const [eventForm, setEventForm] = useState(blankEvent)
  const [selected, setSelected] = useState(null)
  const [registrationForm, setRegistrationForm] = useState(blankRegistration)
  const [registrations, setRegistrations] = useState([])
  const [showRegistrations, setShowRegistrations] = useState(false)
  const [busy, setBusy] = useState(false)

  async function loadEvents() {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/events')
      setEvents(response.data)
    } catch (err) {
      setError(`Cannot load events. Make sure the Spring Boot backend and MySQL are running. ${readableError(err)}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadEvents() }, [])

  function updateEventField(event) {
    const { name, value } = event.target
    setEventForm(current => ({ ...current, [name]: name === 'capacity' ? Number(value) : value }))
  }

  function startCreate() {
    setEditing(null)
    setEventForm(blankEvent)
    setNotice('')
    document.getElementById('event-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  function startEdit(event) {
    setEditing(event.id)
    setEventForm({
      title: event.title, description: event.description, venue: event.venue,
      eventDate: event.eventDate, eventTime: event.eventTime,
      organizer: event.organizer, capacity: event.capacity
    })
    setNotice('')
    document.getElementById('event-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  async function saveEvent(e) {
    e.preventDefault()
    setBusy(true); setError(''); setNotice('')
    try {
      if (editing) await api.put(`/events/${editing}`, eventForm)
      else await api.post('/events', eventForm)
      setNotice(editing ? 'Event updated successfully.' : 'Event created successfully.')
      setEditing(null); setEventForm(blankEvent)
      await loadEvents()
    } catch (err) {
      setError(readableError(err))
    } finally { setBusy(false) }
  }

  async function deleteEvent(event) {
    if (!window.confirm(`Delete "${event.title}"?`)) return
    setError(''); setNotice('')
    try {
      await api.delete(`/events/${event.id}`)
      setNotice('Event deleted successfully.')
      await loadEvents()
    } catch (err) { setError(readableError(err)) }
  }

  async function openRegistration(event) {
    setSelected(event)
    setRegistrationForm(blankRegistration)
    setError(''); setNotice('')
    setShowRegistrations(false)
  }

  async function submitRegistration(e) {
    e.preventDefault()
    if (!selected) return
    setBusy(true); setError(''); setNotice('')
    try {
      await api.post(`/events/${selected.id}/registrations`, registrationForm)
      setNotice(`You have registered for ${selected.title}.`)
      setRegistrationForm(blankRegistration)
      await loadEvents()
    } catch (err) { setError(readableError(err)) }
    finally { setBusy(false) }
  }

  async function viewRegistrations(event) {
    setError(''); setNotice('')
    try {
      const response = await api.get(`/events/${event.id}/registrations`)
      setRegistrations(response.data)
      setSelected(event)
      setShowRegistrations(true)
    } catch (err) { setError(readableError(err)) }
  }

  function closeModal() {
    setSelected(null)
    setShowRegistrations(false)
    setRegistrations([])
  }

  return (
    <div className="app-shell">
      <header className="navbar">
        <a className="brand" href="#"><span className="brand-mark">C</span> Campus<span className="brand-accent">Events</span></a>
        <nav><a href="#events">Explore events</a><a href="#manage">Manage events</a></nav>
        <a className="nav-button" href="#event-form" onClick={startCreate}>+ Create event</a>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow"><span className="live-dot"></span> THE CAMPUS COMMUNITY</span>
            <h1>Make campus life<br /><span>an experience.</span></h1>
            <p>Discover events, meet your community, and make memories beyond the classroom.</p>
            <a className="primary-button hero-button" href="#events">Explore events <span>↓</span></a>
            <div className="hero-stats"><div><strong>{events.length.toString().padStart(2, '0')}</strong><span>Events listed</span></div><i></i><div><strong>01</strong><span>Campus community</span></div></div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-orbit orbit-one"></div><div className="art-orbit orbit-two"></div>
            <div className="art-card art-card-main"><span className="art-label">CAMPUS LIFE</span><div className="art-shape"><div></div><div></div><div></div></div><strong>Ideas meet<br/>opportunity.</strong><span className="art-caption">Find your next thing.</span></div>
            <div className="floating-note note-top">✦ &nbsp; Learn something new</div><div className="floating-note note-bottom">↗ &nbsp; Meet your people</div>
          </div>
        </section>

        <section className="content-section" id="events">
          <div className="section-heading"><div><span className="section-kicker">WHAT'S HAPPENING</span><h2>Upcoming events<span className="heading-dot">.</span></h2><p>Find something that sparks your interest.</p></div><div className="event-count">{events.length} event{events.length === 1 ? '' : 's'} found</div></div>
          {notice && <div className="alert success-alert">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
          {error && <div className="alert error-alert">{error}<button onClick={() => setError('')} aria-label="Dismiss">×</button></div>}
          {loading ? <div className="loading">Loading events…</div> : events.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">✳</div><h3>Your next campus memory starts here.</h3><p>No events have been added yet. Create the first event below.</p><button className="primary-button" onClick={startCreate}>Create first event</button></div>
          ) : (
            <div className="event-grid">{events.map((event, index) => (
              <article className="event-card" key={event.id}>
                <div className={`event-visual visual-${index % 4}`}><span className="visual-tag">{event.organizer}</span><span className="visual-symbol">{['✳', '◈', '✦', '◎'][index % 4]}</span><div className="visual-date"><strong>{new Date(`${event.eventDate}T00:00:00`).getDate().toString().padStart(2, '0')}</strong><span>{new Date(`${event.eventDate}T00:00:00`).toLocaleString('en', { month: 'short' }).toUpperCase()}</span></div></div>
                <div className="event-card-body"><div className="event-meta"><span>◷ {event.eventTime}</span><span>⌖ {event.venue}</span></div><h3>{event.title}</h3><p className="event-description">{event.description}</p><div className="event-card-footer"><button className="text-button" onClick={() => openRegistration(event)}>Register <span>↗</span></button><button className="small-action" title="Edit event" onClick={() => startEdit(event)}>Edit</button><button className="small-action danger-text" title="Delete event" onClick={() => deleteEvent(event)}>Delete</button><button className="small-action" title="View registrations" onClick={() => viewRegistrations(event)}>Students</button></div></div>
              </article>
            ))}</div>
          )}
        </section>

        <section className="manage-section" id="manage">
          <div className="manage-intro"><span className="section-kicker">ADMIN WORKSPACE · DEMO</span><h2>Bring your next<br/>event to life.</h2><p>Add a new event to the campus calendar. It will appear in the list above after saving.</p><div className="manage-mini-stat"><span className="mini-icon">＋</span><span><strong>Event management</strong><small>Create · Edit · Organize</small></span></div></div>
          <div className="form-panel" id="event-form"><div className="form-title-row"><div><span className="section-kicker">{editing ? 'UPDATE DETAILS' : 'GET IT ON THE CALENDAR'}</span><h3>{editing ? 'Edit event' : 'Create an event'}</h3></div><span className="form-step">{editing ? '02' : '01'} / 02</span></div>
            <form onSubmit={saveEvent} className="event-form">
              <label>Event title<input name="title" value={eventForm.title} onChange={updateEventField} placeholder="e.g. Annual Tech Fest" required maxLength="120"/></label>
              <label>Description<textarea name="description" value={eventForm.description} onChange={updateEventField} placeholder="What should students know?" rows="3" required/></label>
              <div className="field-row"><label>Date<input type="date" name="eventDate" value={eventForm.eventDate} onChange={updateEventField} required/></label><label>Time<input type="time" name="eventTime" value={eventForm.eventTime} onChange={updateEventField} required/></label></div>
              <div className="field-row"><label>Venue<input name="venue" value={eventForm.venue} onChange={updateEventField} placeholder="Main auditorium" required/></label><label>Capacity<input type="number" min="1" name="capacity" value={eventForm.capacity} onChange={updateEventField} required/></label></div>
              <label>Organizer<input name="organizer" value={eventForm.organizer} onChange={updateEventField} placeholder="e.g. Student Council" required/></label>
              <div className="form-actions"><button type="submit" className="primary-button" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes ↗' : 'Publish event ↗'}</button>{editing && <button type="button" className="cancel-button" onClick={() => { setEditing(null); setEventForm(blankEvent) }}>Cancel</button>}</div>
            </form>
          </div>
        </section>
      </main>
      <footer><a className="brand footer-brand" href="#"><span className="brand-mark">C</span> Campus<span className="brand-accent">Events</span></a><span>Built for campus communities.</span><a href="#events">Back to top ↑</a></footer>

      {selected && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) closeModal() }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="modal-close" onClick={closeModal} aria-label="Close">×</button>
        {showRegistrations ? <><span className="section-kicker">EVENT ATTENDEES</span><h2 id="modal-title">Registrations</h2><p className="modal-subtitle">{selected.title} · {registrations.length} student(s)</p>{registrations.length === 0 ? <div className="empty-registrations">No students have registered yet.</div> : <div className="registration-list">{registrations.map(reg => <div className="registration-row" key={reg.id}><div className="avatar">{reg.studentName?.charAt(0)?.toUpperCase()}</div><div><strong>{reg.studentName}</strong><span>{reg.email} · {reg.studentId}</span></div></div>)}</div>}</> : <><span className="section-kicker">SAVE YOUR SPOT</span><h2 id="modal-title">Register for<br/>{selected.title}</h2><p className="modal-subtitle">{selected.eventDate} · {selected.eventTime} · {selected.venue}</p><form className="event-form" onSubmit={submitRegistration}><label>Full name<input value={registrationForm.studentName} onChange={e => setRegistrationForm({...registrationForm, studentName:e.target.value})} placeholder="Your name" required/></label><label>College email<input type="email" value={registrationForm.email} onChange={e => setRegistrationForm({...registrationForm, email:e.target.value})} placeholder="you@college.edu" required/></label><label>Student ID<input value={registrationForm.studentId} onChange={e => setRegistrationForm({...registrationForm, studentId:e.target.value})} placeholder="Your student ID" required/></label><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Confirm registration ↗'}</button></form></>}
      </section></div>}
    </div>
  )
}
