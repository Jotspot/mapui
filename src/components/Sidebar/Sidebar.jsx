import { useState } from 'react'
import './Sidebar.css'
import TeamsPanel from './TeamsPanel.jsx'
import WaypointsPanel from './WaypointsPanel.jsx'
import RoutesPanel from './RoutesPanel.jsx'
import SettingsPanel from './SettingsPanel.jsx'

const TABS = ['Teams', 'Waypoints', 'Routes', '⚙']

export default function Sidebar({ onAddTeam, onEditTeam, onAddWaypoint, onAddRoute, onEditRoute, onPlaySingle }) {
  const [tab, setTab] = useState('Teams')

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">🗺️ Jetlag Map</div>
        <div className="sidebar-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              className={`sidebar-tab${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="sidebar-content">
        {tab === 'Teams' && <TeamsPanel onAdd={onAddTeam} onEdit={onEditTeam} />}
        {tab === 'Waypoints' && <WaypointsPanel onAdd={onAddWaypoint} />}
        {tab === 'Routes' && <RoutesPanel onAdd={onAddRoute} onEdit={onEditRoute} onPlaySingle={onPlaySingle} />}
        {tab === '⚙' && <SettingsPanel />}
      </div>
    </div>
  )
}
