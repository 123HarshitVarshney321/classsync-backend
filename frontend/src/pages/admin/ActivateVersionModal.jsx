import Modal from '../../components/Modal.jsx'

export default function ActivateVersionModal({
  isOpen,
  version,
  effectiveFrom,
  setEffectiveFrom,
  loading,
  onConfirm,
  onClose,
}) {
  if (!isOpen || !version) return null

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Activate Timetable Version v${version.versionNumber}`}
    >
      <form onSubmit={onConfirm} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            Effective From Date *
          </label>
          <input
            type="date"
            required
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded leading-relaxed">
          The current ACTIVE version of the same academic year and semester will be archived. Its official classes on or after this date will be marked SUPERSEDED. Extra classes are not touched.
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? 'Activating...' : 'Confirm Activation'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

